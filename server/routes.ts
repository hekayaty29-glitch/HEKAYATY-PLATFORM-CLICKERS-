import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertStorySchema, 
  insertRatingSchema, 
  insertBookmarkSchema,
  registerSchema,
  publishStorySchema
} from "@shared/schema";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";

const ONE_DAY = 1000 * 60 * 60 * 24;
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(
    session({
      cookie: { maxAge: ONE_DAY },
      store: new SessionStore({ checkPeriod: ONE_DAY }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "talekeeper-secret",
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: () => void) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Remove confirmPassword field before creating user
      const { confirmPassword, ...userToCreate } = data;
      const user = await storage.createUser(userToCreate);
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(data.username);
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Verify user is updating their own profile
    if (userId !== req.session.userId) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }
    
    try {
      // Allow updating only certain fields
      const updateSchema = z.object({
        fullName: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
      });
      
      const data = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/premium", requireAuth, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Verify user is updating their own subscription
    if (userId !== req.session.userId) {
      return res.status(403).json({ message: "You can only update your own subscription" });
    }
    
    try {
      const updatedUser = await storage.updateUser(userId, { isPremium: true });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Story routes
  app.get("/api/stories", async (req, res) => {
    try {
      const authorId = req.query.authorId ? parseInt(req.query.authorId as string, 10) : undefined;
      const genreId = req.query.genreId ? parseInt(req.query.genreId as string, 10) : undefined;
      const isPremium = req.query.isPremium ? req.query.isPremium === 'true' : undefined;
      const isShortStory = req.query.isShortStory ? req.query.isShortStory === 'true' : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      
      const stories = await storage.getStories({
        authorId,
        genreId,
        isPremium,
        isShortStory,
        limit,
        offset
      });
      
      // Add rating information to each story
      const storiesWithRatings = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await storage.getAverageRating(story.id);
          const genres = await storage.getStoryGenres(story.id);
          const author = await storage.getUser(story.authorId);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.fullName,
              avatarUrl: author.avatarUrl
            } : null
          };
        })
      );
      
      res.json(storiesWithRatings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stories/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
      const stories = await storage.getFeaturedStories(limit);
      
      // Add rating and genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await storage.getAverageRating(story.id);
          const genres = await storage.getStoryGenres(story.id);
          const author = await storage.getUser(story.authorId);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.fullName,
              avatarUrl: author.avatarUrl
            } : null
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stories/top-rated", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
      const stories = await storage.getTopRatedStories(limit);
      
      // Add genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const genres = await storage.getStoryGenres(story.id);
          const ratings = await storage.getRatings(story.id);
          const author = await storage.getUser(story.authorId);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            genres,
            ratingCount: ratings.length,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.fullName,
              avatarUrl: author.avatarUrl
            } : null
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stories/:id", async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await storage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Check if the story is published or the user is the author
    if (!story.isPublished && (!req.session.userId || req.session.userId !== story.authorId)) {
      return res.status(403).json({ message: "This story is not published yet" });
    }
    
    // Add rating and genre information
    const averageRating = await storage.getAverageRating(storyId);
    const genres = await storage.getStoryGenres(storyId);
    const author = await storage.getUser(story.authorId);
    const ratings = await storage.getRatings(storyId);
    
    // Check for user bookmark if logged in
    let isBookmarked = false;
    if (req.session.userId) {
      const bookmark = await storage.getBookmark(req.session.userId, storyId);
      isBookmarked = !!bookmark;
    }
    
    res.json({
      ...story,
      averageRating,
      genres,
      author: author ? {
        id: author.id,
        username: author.username,
        fullName: author.fullName,
        avatarUrl: author.avatarUrl,
        bio: author.bio
      } : null,
      ratingCount: ratings.length,
      isBookmarked
    });
  });

  app.post("/api/stories", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Make sure user has author role
      if (!user.isAuthor) {
        await storage.updateUser(userId, { isAuthor: true });
      }
      
      const data = publishStorySchema.parse(req.body);
      
      // Check story publishing limits for free users
      if (!user.isPremium) {
        const novelCount = await storage.countAuthorStories(userId, false);
        const shortStoryCount = await storage.countAuthorStories(userId, true);
        
        if (data.isShortStory && shortStoryCount >= 1) {
          return res.status(403).json({ message: "Free users can only publish 1 short story" });
        }
        
        if (!data.isShortStory && novelCount >= 1) {
          return res.status(403).json({ message: "Free users can only publish 1 novel" });
        }
      }
      
      // Create the story
      const { genreIds, ...storyData } = data;
      const story = await storage.createStory({
        ...storyData,
        authorId: userId
      });
      
      // Add genres
      for (const genreId of genreIds) {
        await storage.addStoryGenre({
          storyId: story.id,
          genreId
        });
      }
      
      res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/stories/:id", requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await storage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Verify user is the author
    if (story.authorId !== req.session.userId) {
      return res.status(403).json({ message: "You can only update your own stories" });
    }
    
    try {
      // Allow updating only certain fields
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
        isPremium: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      });
      
      const data = updateSchema.parse(req.body);
      const updatedStory = await storage.updateStory(storyId, data);
      
      if (!updatedStory) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      res.json(updatedStory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/stories/:id", requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await storage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Verify user is the author
    if (story.authorId !== req.session.userId) {
      return res.status(403).json({ message: "You can only delete your own stories" });
    }
    
    const deleted = await storage.deleteStory(storyId);
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete story" });
    }
    
    res.json({ message: "Story deleted successfully" });
  });

  // Genre routes
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Rating routes
  app.post("/api/stories/:id/rate", requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await storage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    try {
      const data = insertRatingSchema.parse({
        ...req.body,
        userId: req.session.userId,
        storyId
      });
      
      // Check if user already rated
      const existingRating = await storage.getRating(data.userId, storyId);
      
      let rating;
      if (existingRating) {
        rating = await storage.updateRating(existingRating.id, {
          rating: data.rating,
          review: data.review
        });
      } else {
        rating = await storage.createRating(data);
      }
      
      const averageRating = await storage.getAverageRating(storyId);
      
      res.json({
        rating,
        averageRating
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stories/:id/ratings", async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    try {
      const ratings = await storage.getRatings(storyId);
      
      // Add user information to each rating
      const ratingsWithUser = await Promise.all(
        ratings.map(async (rating) => {
          const user = await storage.getUser(rating.userId);
          return {
            ...rating,
            user: user ? {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              avatarUrl: user.avatarUrl
            } : null
          };
        })
      );
      
      res.json(ratingsWithUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bookmark routes
  app.post("/api/stories/:id/bookmark", requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await storage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    try {
      const userId = req.session.userId as number;
      
      // Check if already bookmarked
      const existingBookmark = await storage.getBookmark(userId, storyId);
      
      if (existingBookmark) {
        return res.status(400).json({ message: "Story already bookmarked" });
      }
      
      const bookmark = await storage.createBookmark({
        userId,
        storyId
      });
      
      res.status(201).json(bookmark);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/stories/:id/bookmark", requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    try {
      const userId = req.session.userId as number;
      const deleted = await storage.deleteBookmark(userId, storyId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      res.json({ message: "Bookmark removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const stories = await storage.getBookmarks(userId);
      
      // Add rating and genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await storage.getAverageRating(story.id);
          const genres = await storage.getStoryGenres(story.id);
          const author = await storage.getUser(story.authorId);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.fullName,
              avatarUrl: author.avatarUrl
            } : null
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
