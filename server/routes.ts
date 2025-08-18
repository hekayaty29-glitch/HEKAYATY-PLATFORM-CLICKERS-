import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { supabaseStorage } from "./supabase-storage";
import { authValidation, storyValidation, userValidation, handleValidationErrors } from "./security-middleware";
import { checkDatabasePermissions, logDatabaseQueries, auditLog } from "./database-security";
import { checkAccountLockout, recordFailedLogin, recordSuccessfulLogin, checkSuspiciousIP, recordIPAttempt } from "./auth-security";
import { 
  insertUserSchema, 
  loginSchema, 
  insertStorySchema, 
  insertRatingSchema, 
  insertBookmarkSchema,
  registerSchema,
  publishStorySchema,
  taleCraftPublishSchema
} from "@shared/schema";
import express from "express";
import { z } from "zod";
import { registerAdminAPI } from "./admin-api";
import { registerSubscriptionRoutes } from "./subscription-routes";
import { registerCommunityRoutes } from "./community-routes";
import { registerUploadRoutes } from "./upload-routes";
import { registerHallOfQuillsRoutes } from "./hall-of-quills-routes";
import { 
  supabase, 
  verifySupabaseToken, 
  requireAuth, 
  requireAdmin,
  getUserProfile,
  updateUserProfile
} from "./supabase-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware for all API routes
  app.use('/api', logDatabaseQueries);
  
  // Apply Supabase JWT verification to protected routes (skip auth routes)
  app.use('/api', (req, res, next) => {
    // Check for suspicious IP activity
    const clientIP: string = req.ip || 'unknown';
    if (checkSuspiciousIP(clientIP)) {
      auditLog.logSecurityEvent('suspicious_ip_blocked', 'high', { ip: clientIP, path: req.path });
      return res.status(429).json({ error: 'Access temporarily restricted' });
    }
    
    recordIPAttempt(clientIP);
    
    // Public API paths that don't need JWT verification
    // Note: inside this middleware req.path has the '/api' prefix stripped
    const publicPaths = [
      '/auth/',
      '/subscriptions/free',
      '/subscriptions/redeem'
    ];
    const isPublic = publicPaths.some((p) => req.path === p || req.path.startsWith(p + '/'));
    if (isPublic) {
      return next();
    }
    return verifySupabaseToken(req, res, next);
  });
  
  // Database permissions check for authenticated routes
  app.use('/api', (req, res, next) => {
    if (req.user) {
      return checkDatabasePermissions(req, res, next);
    }
    next();
  });

  // Register admin API
  registerAdminAPI(app);
  // Register subscription code API
  registerSubscriptionRoutes(app);
  registerCommunityRoutes(app);
  // Register upload routes
  registerUploadRoutes(app);
  // Hall of Quills public & admin routes
  registerHallOfQuillsRoutes(app);

  // ---------------------------------------------------------------------------
  // Characters API
  // ---------------------------------------------------------------------------
  app.get("/api/characters", async (_req: Request, res: Response) => {
    try {
      const characters = await supabaseStorage.getCharacters();
      res.json(characters);
    } catch (err) {
      console.error("Get characters error:", err);
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  const insertCharacterSchema = z.object({
    name: z.string().min(2),
    description: z.string().min(10),
    role: z.string().min(2),
    image: z.string().url(),
  });

  app.post("/api/characters", requireAdmin, async (req: Request, res: Response) => {
    try {
      const body = insertCharacterSchema.parse(req.body);
      const created = await supabaseStorage.createCharacter(body);
      if (!created) {
        return res.status(500).json({ message: "Could not create character" });
      }
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Create character error:", err);
      res.status(500).json({ message: "Failed to create character" });
    }
  });

  // Top creators endpoint
  app.get("/api/creators/top", async (_req: Request, res: Response) => {
    try {
      const creators = await supabaseStorage.getTopCreators(5);
      res.json(creators);
    } catch (err) {
      console.error('Top creators error:', err);
      res.status(500).json({ message: 'Failed to fetch top creators' });
    }
  });

  

  // Authentication routes - these don't need JWT verification as they're for login/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName } = req.body;
      
      // Check if username already exists in profiles table
      const { data: existingUsername } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();
      
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          username: username.toLowerCase(),
          full_name: fullName
        }
      });
      
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      // Create profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username.toLowerCase(),
          email,
          full_name: fullName,
          avatar_url: '',
          bio: '',
          is_premium: false,
          is_admin: false,
          role: 'user'
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        return res.status(500).json({ message: "Failed to create user profile" });
      }
      
      res.status(201).json({ 
        message: "User created successfully",
        user: {
          id: data.user.id,
          email: data.user.email,
          username: username.toLowerCase(),
          full_name: fullName
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Determine if input is email or username
      let email = username;
      if (!username.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username.toLowerCase())
          .single();
        
        if (!profile?.email) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
        email = profile.email;
      }
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Get user profile
      const profile = await getUserProfile(data.user.id);
      
      res.json({
        message: "Login successful",
        user: {
          id: data.user.id,
          email: data.user.email,
          username: profile.username,
          fullName: profile.full_name,
          avatar_url: profile.avatar_url,
          is_premium: profile.is_premium,
          is_admin: profile.is_admin
        },
        session: data.session
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await supabase.auth.admin.signOut(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Could not log out" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const profile = await getUserProfile(req.user.id);
      
      res.json({
        id: req.user.id,
        email: req.user.email,
        username: profile.username,
        fullName: profile.full_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        is_premium: profile.is_premium,
        is_admin: profile.is_admin,
        role: profile.role
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    const genres = await supabaseStorage.getAllGenres();
    const stories = await supabaseStorage.getStories();
    const featuredStories = await supabaseStorage.getFeaturedStories();
    const topRatedStories = await supabaseStorage.getTopRatedStories();
    const users = await supabaseStorage.countUsers();
    const lords = await supabaseStorage.countSubscribers(); // paying users as "lords"
    const revenue_month = 0;
    res.json({ users, stories, lords, revenue_month, genres, featuredStories, topRatedStories });
  });


  // User routes
  app.get("/api/users/:id", async (req, res) => {
    const userId = req.params.id;
    
    try {
      const user = await supabaseStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Complete profile for OAuth users (Google sign-up)
  app.post("/api/auth/complete-profile", verifySupabaseToken, async (req, res) => {
    try {
      const { username, fullName } = req.body;
      const userId = req.user!.id;
      const email = req.user!.email;

      // Validate input
      if (!username || !fullName) {
        return res.status(400).json({ message: "Username and full name are required" });
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }

      // Create/update profile for OAuth user
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          username: username.toLowerCase(), 
          email: email,
          full_name: fullName,
          created_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Profile creation error:', error);
        return res.status(500).json({ message: "Failed to create profile" });
      }

      res.json({ 
        success: true, 
        message: "Profile completed successfully",
        user: {
          id: userId,
          email: email,
          username: username.toLowerCase(),
          full_name: fullName
        }
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    const userId = req.params.id;
    
    // Verify user is updating their own profile
    if (userId !== req.user!.id) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }
    
    try {
      // Allow updating only certain fields
      const updateSchema = z.object({
        fullName: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
        username: z.string().min(3).optional(),
      });
      
      const data = updateSchema.parse(req.body);

      // If username provided, ensure user has no username yet and it's unique
      if (data.username) {
        const current = await supabaseStorage.getUserProfile(userId);
        if (current?.username) {
          return res.status(400).json({ message: "Username already set" });
        }
        const existing = await supabase
          .from('profiles')
          .select('id')
          .eq('username', data.username.toLowerCase())
          .single();
        if (existing.data) {
          return res.status(400).json({ message: "Username is already taken" });
        }
        data.username = data.username.toLowerCase();
      }

      const updatedUser = await supabaseStorage.updateUser(userId, data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/premium", requireAuth, async (req, res) => {
    const userId = req.params.id;
    
    // Verify user is updating their own subscription
    if (req.user!.id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const updatedProfile = await updateUserProfile(userId, { is_premium: true });
      res.json(updatedProfile);
    } catch (error) {
      console.error('Premium upgrade error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comics routes
  app.get("/api/comics", async (req, res) => {
    const { authorId, includeDrafts, limit, offset } = req.query as { authorId?: string; includeDrafts?: string; limit?: string; offset?: string };
    try {
      const comics = await supabaseStorage.getComics({
        authorId,
        includeDrafts: includeDrafts === "true",
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });
      res.json(comics);
    } catch (err) {
      console.error("Get comics error", err);
      res.status(500).json({ message: "Failed to fetch comics" });
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
      
      const stories = await supabaseStorage.getStories({
        authorId: authorId?.toString(),
        genreId: genreId,
        isPremium,
        isShortStory,
        limit,
        offset
      });
      
      // Add rating information to each story
      const storiesWithRatings = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await supabaseStorage.getAverageRating(story.id);
          const genres = await supabaseStorage.getStoryGenres(story.id);
          const author = await supabaseStorage.getUser(story.author_id);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.full_name,
              avatarUrl: author.avatar_url
            } : null
          };
        })
      );
      
      res.json(storiesWithRatings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create story (author or admin)
  app.post("/api/stories", requireAuth, async (req: Request, res: Response) => {
    try {
      const storySchema = z.object({
        title: z.string().min(1),
        description: z.string().min(10),
        content: z.string().min(100),
        coverImage: z.string().url().optional(),
        posterImage: z.string().url().optional(),
        workshopId: z.string().uuid().optional(),
        isPremium: z.boolean().optional(),
        isShortStory: z.boolean().optional(),
        isPublished: z.boolean().optional()
      });
      const data = storySchema.parse(req.body);

      // Validate workshop ownership if provided
      if (data.workshopId) {
        const { data: workshop, error: workshopError } = await supabase
          .from('workshops')
          .select('id, owner_id')
          .eq('id', data.workshopId)
          .single();
        if (workshopError || !workshop) {
          return res.status(400).json({ message: 'Invalid workshop_id' });
        }
        if (workshop.owner_id !== req.user!.id) {
          return res.status(403).json({ message: 'You do not own this workshop' });
        }
      }

      const story = await supabaseStorage.createStory({
        title: data.title,
        description: data.description,
        content: data.content,
        cover_image: data.coverImage,
        poster_image: data.posterImage,
        author_id: req.user!.id,
        workshop_id: data.workshopId,
        is_premium: data.isPremium || false,
        is_published: data.isPublished || false,
        is_short_story: data.isShortStory || false
      });

      return res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Create story error', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ---------------------------------------------------------------------------
  // Hekayaty Originals – stories tagged with the "Hekayaty Original" genre
  // ---------------------------------------------------------------------------
  app.get("/api/stories/originals", async (req, res) => {
    try {
      // Hard-coded slug matches the item returned by supabaseStorage.getAllGenres()
      const originalGenre = await supabaseStorage.getGenreBySlug("hekayaty_original");
      if (!originalGenre) {
        return res.status(404).json({ message: "Originals genre not found" });
      }

      const stories = await supabaseStorage.getStories({ genreId: originalGenre.id });

      // Add rating & author details like other list endpoints
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await supabaseStorage.getAverageRating(story.id);
          const author = await supabaseStorage.getUser(story.author_id);

          const { content, ...storyWithoutContent } = story;

          return {
            ...storyWithoutContent,
            averageRating,
            author: author
              ? {
                  id: author.id,
                  username: author.username,
                  fullName: author.full_name,
                  avatarUrl: author.avatar_url,
                }
              : null,
          };
        })
      );

      res.json(storiesWithDetails);
    } catch (error) {
      console.error("Original stories error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stories/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
      const stories = await supabaseStorage.getFeaturedStories(limit);
      
      // Add rating and genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await supabaseStorage.getAverageRating(story.id);
          const genres = await supabaseStorage.getStoryGenres(story.id);
          const author = await supabaseStorage.getUser(story.author_id);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.full_name,
              avatarUrl: author.avatar_url
            } : null
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ---------------------------------------------------------------------------
  // Hall of Quills API -------------------------------------------------------
  // ---------------------------------------------------------------------------
  app.get("/api/hall-of-quills/active", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
      const creators = await supabaseStorage.getTopCreators(limit);
      const writers = creators.map((c) => ({
        id: c.id,
        name: c.username,
        title: `${c.comics_count} published works`,
        avatar: c.avatar_url || "https://placehold.co/96x96", // fallback avatar
        stories: c.comics_count,
        reads: "-", // not tracked yet
      }));
      res.json(writers);
    } catch (error) {
      console.error("Hall active writers error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/hall-of-quills/best", async (req, res) => {
    /* For now, reuse top creators (limit 5). Later could rank by ratings */
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const creators = await supabaseStorage.getTopCreators(limit);
      const best = creators.map((c) => ({
        id: c.id,
        name: c.username,
        title: `${c.comics_count} published works`,
        avatar: c.avatar_url || "https://placehold.co/96x96",
        stories: c.comics_count,
        reads: "-",
      }));
      res.json(best);
    } catch (error) {
      console.error("Hall best writers error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Placeholder - competitions and honorable mentions arrays held in memory for now
  const competitions: any[] = [];
  const honorable: any[] = [];

  app.get("/api/hall-of-quills/competitions", (_req, res) => {
    res.json(competitions);
  });

  app.get("/api/hall-of-quills/honorable", (_req, res) => {
    res.json(honorable);
  });

  app.post("/api/hall-of-quills/competitions", requireAdmin, (req, res) => {
    const { name, winnerName, storyTitle } = req.body;
    if (!name || !winnerName || !storyTitle) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const entry = {
      id: Date.now(),
      name,
      winner: { name: winnerName, avatar: "https://placehold.co/64x64" },
      storyTitle,
    };
    competitions.unshift(entry);
    res.status(201).json(entry);
  });

  app.post("/api/hall-of-quills/honorable", requireAdmin, (req, res) => {
    const { name, quote } = req.body;
    if (!name || !quote) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const entry = { id: Date.now(), name, quote };
    honorable.unshift(entry);
    res.status(201).json(entry);
  });

  app.get("/api/stories/top-rated", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
      const stories = await supabaseStorage.getTopRatedStories(limit);
      
      // Add genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const genres = await supabaseStorage.getStoryGenres(story.id);
          const ratings = await supabaseStorage.getRatings(story.id);
          const author = await supabaseStorage.getUser(story.author_id);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            genres,
            ratingCount: ratings.length,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.full_name,
              avatarUrl: author.avatar_url
            } : null
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comic publish route (admin only)
  app.post("/api/comics", requireAdmin, async (req: Request, res: Response) => {
    try {
      const comicSchema = z.object({
        title: z.string().min(1),
        description: z.string().min(10),
        pdfUrl: z.string().url().optional(),
        coverImage: z.string().url().optional(),
        workshopId: z.string().uuid().optional(),
        isPremium: z.boolean().optional(),
        isPublished: z.boolean().optional()
      });
      const data = comicSchema.parse(req.body);

      // Validate workshop ownership if workshopId provided
      if (data.workshopId) {
        const { data: workshop, error: workshopError } = await supabase
          .from('workshops')
          .select('id, owner_id')
          .eq('id', data.workshopId)
          .single();
        if (workshopError || !workshop) {
          return res.status(400).json({ message: 'Invalid workshop_id' });
        }
        if (workshop.owner_id !== req.user!.id) {
          return res.status(403).json({ message: 'You do not own this workshop' });
        }
      }

      const comic = await supabaseStorage.createComic({
        title: data.title,
        description: data.description,
        pdf_url: data.pdfUrl,
        cover_image: data.coverImage,
        author_id: req.user!.id, // admin publishing on behalf of themselves
        workshop_id: data.workshopId,
        is_premium: data.isPremium || false,
        is_published: data.isPublished || false
      });

      return res.status(201).json(comic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create comic error", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

// Story routes

app.get("/api/stories/:id", async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Check if the story is published or the user is the author
    if (!story.is_published && (!req.user?.id || req.user.id !== story.author_id)) {
      return res.status(403).json({ message: "This story is not published yet" });
    }
    
    // Add rating and genre information
    const ratings = await supabaseStorage.getRatings(storyId);
    const avgRating = await supabaseStorage.getAverageRating(storyId);
    const ratingCount = ratings.length;
    const userRating = req.user?.id ? await supabaseStorage.getRating(req.user.id, storyId) : null;
    const genres = await supabaseStorage.getStoryGenres(storyId);
    const author = await supabaseStorage.getUser(story.author_id);
    
    // Check for user bookmark if logged in
    let isBookmarked = false;
    if (req.user?.id) {
      const bookmark = await supabaseStorage.getBookmark(req.user.id, storyId);
      isBookmarked = !!bookmark;
    }
    
    res.json({
      ...story,
      avgRating,
      genres,
      author: author ? {
        id: author.id,
        username: author.username,
        fullName: author.full_name,
        avatarUrl: author.avatar_url,
        bio: author.bio
      } : null,
      ratingCount,
      userRating,
      isBookmarked
    });
  });

  app.put("/api/stories/:id", requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Verify user is the author
    if (story.author_id !== req.user!.id) {
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
      const updatedStory = await supabaseStorage.updateStory(storyId, data);
      
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
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    // Verify user is the author
    if (story.author_id !== req.user!.id) {
      return res.status(403).json({ message: "You can only delete your own stories" });
    }
    
    const deleted = await supabaseStorage.deleteStory(storyId);
    if (!deleted) {
      return res.status(500).json({ message: "Failed to delete story" });
    }
    
    res.json({ message: "Story deleted successfully" });
  });

  // ---------------------------------------------------------------------------
  // Story download counter
  // ---------------------------------------------------------------------------
  app.post("/api/stories/:id/download", async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }

    try {
      // Check if story exists and is published
      const { data: story, error } = await supabase
        .from('stories')
        .select('id, is_published')
        .eq('id', storyId)
        .single();
      if (error || !story) {
        return res.status(404).json({ message: 'Story not found' });
      }
      if (!story.is_published) {
        return res.status(403).json({ message: 'Story is not published' });
      }

      // Increment download_count atomically
      const { error: updateError } = await supabase.rpc('increment_story_downloads', { story_id: storyId });
      if (updateError) {
        console.error('Failed to increment download count via RPC', updateError);
      }

      return res.status(204).send();
    } catch (err) {
      console.error('Download counter error', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Genre routes
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await supabaseStorage.getAllGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/genres/:id", async (req, res) => {
    try {
      const genreId = parseInt(req.params.id, 10);
      const genre = await supabaseStorage.getGenre(genreId);
      res.json(genre);
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
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    try {
      const data = insertRatingSchema.parse({
        ...req.body,
        userId: req.user!.id,
        storyId
      });
      
      // Check if user already rated
      const existingRating = await supabaseStorage.getRating(data.userId.toString(), data.storyId);
      
      let rating;
      if (existingRating) {
        rating = await supabaseStorage.updateRating(existingRating.id, {
          rating: data.rating,
          review: data.review
        });
      } else {
        rating = await supabaseStorage.createRating({
          user_id: data.userId.toString(),
          story_id: data.storyId,
          rating: data.rating,
          review: data.review || undefined
        });
      }
      
      const averageRating = await supabaseStorage.getAverageRating(storyId);
      
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
      const ratings = await supabaseStorage.getRatings(storyId);
      
      // Add user information to each rating
      const ratingsWithUser = await Promise.all(
        ratings.map(async (rating) => {
          const user = await supabaseStorage.getUser(rating.user_id);
          return {
            ...rating,
            user: user ? {
              id: user.id,
              username: user.username,
              fullName: user.full_name,
              avatarUrl: user.avatar_url
            } : null
          };
        })
      );
      
      res.json(ratingsWithUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Originals public endpoint
  app.get("/api/originals/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    try {
      const story = await supabaseStorage.getStory(id);
      if (!story || !story.is_published) {
        return res.status(404).json({ message: "Story not found" });
      }

      /* Map DB story -> client StoryWorld DTO.
         For now, characters & map placeholders empty; extend later.
      */
      const dto = {
        id: story.id,
        title: story.title,
        posterUrl: story.cover_image || "",
        description: story.description,
        soundtrackUrl: undefined,
        characters: [],
        mapImageUrl: undefined,
      };
      return res.json(dto);
    } catch (error) {
      console.error("Error fetching original story:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chapters list for an original
  app.get("/api/originals/:id/chapters", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, title, summary, cover_url, order')
        .eq('story_id', id)
        .order('order');

      if (error) {
        console.error('Chapters fetch error', error);
        return res.status(500).json({ message: 'Error fetching chapters' });
      }
      const chapters = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        coverUrl: row.cover_url || '',
        unlocked: true,
      }));
      return res.json(chapters);
    } catch (err) {
      console.error('Unexpected error fetching chapters', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Page content for a chapter page
  app.get("/api/originals/:storyId/chapters/:chapterId/pages/:pageNum", async (req, res) => {
    const storyId = parseInt(req.params.storyId, 10);
    const chapterId = parseInt(req.params.chapterId, 10);
    const pageNum = parseInt(req.params.pageNum, 10);
    if ([storyId, chapterId, pageNum].some(Number.isNaN)) {
      return res.status(400).json({ message: "Invalid params" });
    }
    try {
      const { data: pageRow, error } = await supabase
        .from('pages')
        .select('id, banner_url, audio_url, html_content, order')
        .eq('story_id', storyId)
        .eq('chapter_id', chapterId)
        .eq('order', pageNum)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Fetch page error', error);
        return res.status(500).json({ message: 'Error fetching page' });
      }
      if (!pageRow) return res.status(404).json({ message: 'Page not found' });

      // Determine prev / next existence
      const { count } = await supabase
        .from('pages')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
        .eq('chapter_id', chapterId);
      const prevPage = pageNum > 1 ? pageNum - 1 : undefined;
      const nextPage = count && pageNum < count ? pageNum + 1 : undefined;

      return res.json({
        id: pageRow.id,
        bannerUrl: pageRow.banner_url || '',
        audioUrl: pageRow.audio_url || '',
        content: pageRow.html_content,
        prevPage,
        nextPage,
      });
    } catch (err) {
      console.error('Unexpected error fetching page', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Users public profile
  app.get("/api/users/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const user = await supabaseStorage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Followers/following counts placeholder (use relationships table later)
      const followersCount = 0;
      const followingCount = 0;

      const dto = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        bio: user.bio,
        avatar: user.avatar_url,
        isPremium: user.is_premium,
        isAuthor: user.is_author,
        followersCount,
        followingCount,
        createdAt: user.created_at,
      };
      return res.json(dto);
    } catch (err) {
      console.error('Error fetching user', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Stories list with optional author filter
  app.get("/api/stories", async (req, res) => {
    const { authorId } = req.query as { authorId?: string };
    try {
      const stories = await supabaseStorage.getStories({ authorId });
      return res.json(stories);
    } catch (e) {
      console.error('Error fetching stories', e);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Novels endpoint (assuming supabaseStorage.getStories with is_short_story flag false)
  app.get("/api/novels", async (req, res) => {
    const { authorId } = req.query as { authorId?: string };
    try {
      const novels = await supabaseStorage.getStories({ authorId, isShortStory: false });
      return res.json(novels);
    } catch (e) {
      console.error('Error fetching novels', e);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User bookmarks (requires auth)
  app.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const userId = req.user.id;
      const bookmarks = await supabaseStorage.getBookmarks(userId);
      return res.json(bookmarks);
    } catch (e) {
      console.error('Error bookmarks', e);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User purchases
  app.get("/api/purchases", requireAuth, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    try {
      const purchases = await supabaseStorage.getUserPurchases(req.user.id);
      return res.json(purchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // TalesCraft CRUD endpoints
  app.get("/api/talecraft/story-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const projects = await supabaseStorage.getTaleCraftProjects(req.user.id, 'story');
      res.json(projects);
    } catch (error) {
      console.error("Error fetching story projects:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/talecraft/story-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const newProject = {
        id: Date.now().toString(),
        title: req.body.title || "Untitled Story",
        type: "story" as const,
        content: req.body.content || "",
        author_id: req.user.id,
        chapters: [],
        pages: [],
        last_modified: new Date().toISOString()
      };
      const created = await supabaseStorage.createTaleCraftProject(newProject);
      res.json(created);
    } catch (error) {
      console.error("Error creating story project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/talecraft/story-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const updated = await supabaseStorage.updateTaleCraftProject(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating story project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/talecraft/story-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const success = await supabaseStorage.deleteTaleCraftProject(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting story project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Comic projects endpoints
  app.get("/api/talecraft/comic-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const projects = await supabaseStorage.getTaleCraftProjects(req.user.id, 'comic');
      res.json(projects);
    } catch (error) {
      console.error("Error fetching comic projects:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/talecraft/comic-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const newProject = {
        id: Date.now().toString(),
        title: req.body.title || "Untitled Comic",
        type: "comic" as const,
        content: req.body.content || "",
        author_id: req.user.id,
        chapters: [],
        pages: [],
        last_modified: new Date().toISOString()
      };
      const created = await supabaseStorage.createTaleCraftProject(newProject);
      res.json(created);
    } catch (error) {
      console.error("Error creating comic project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/talecraft/comic-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const updated = await supabaseStorage.updateTaleCraftProject(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating comic project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/talecraft/comic-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const success = await supabaseStorage.deleteTaleCraftProject(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting comic project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Photo projects endpoints
  app.get("/api/talecraft/photo-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const projects = await supabaseStorage.getTaleCraftProjects(req.user.id, 'photo');
      res.json(projects);
    } catch (error) {
      console.error("Error fetching photo projects:", error);
      res.status(500).json({ message: "Failed to fetch photo projects" });
    }
  });

  app.post("/api/talecraft/photo-projects", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const newProject = {
        id: Date.now().toString(),
        title: req.body.title || "Untitled Photo Story",
        type: "photo" as const,
        content: req.body.content || "",
        author_id: req.user.id,
        chapters: [],
        pages: [],
        last_modified: new Date().toISOString()
      };
      const created = await supabaseStorage.createTaleCraftProject(newProject);
      res.json(created);
    } catch (error) {
      console.error("Error creating photo project:", error);
      res.status(500).json({ message: "Failed to create photo project" });
    }
  });

  app.patch("/api/talecraft/photo-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const updated = await supabaseStorage.updateTaleCraftProject(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating photo project:", error);
      res.status(500).json({ message: "Failed to update photo project" });
    }
  });

  app.delete("/api/talecraft/photo-projects/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const { id } = req.params;
      const success = await supabaseStorage.deleteTaleCraftProject(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting photo project:", error);
      res.status(500).json({ message: "Failed to delete photo project" });
    }
  });

  // TalesCraft publish endpoint
  app.post("/api/talecraft/publish", requireAuth, async (req, res) => {
    try {
      const data = taleCraftPublishSchema.parse(req.body);

      // Role-based page publishing permissions
      if (data.page === "hekayaty_original" && !req.user!.is_admin) {
        return res.status(403).json({ message: "Only admins can publish to Hekayaty Original" });
      }

      // Persist story or comic based on projectType
      if (data.projectType === "story") {
        const newStory = await supabaseStorage.createStory({
          title: data.title,
          description: data.description,
          content: data.content,
          cover_image: data.coverImage || undefined,
          poster_image: undefined,
          author_id: req.user!.id,
          workshop_id: undefined,
          is_premium: data.isPremium,
          is_published: true,
          is_short_story: false,
        });

        if (!newStory) {
          return res.status(500).json({ message: "Failed to create story" });
        }
        return res.status(201).json({ message: "Story published successfully", story: newStory });
      } else {
        // Treat TaleCraft comic export as PDF when format === 'pdf'. Otherwise store without pdf_url.
        const newComic = await supabaseStorage.createComic({
          title: data.title,
          description: data.description,
          cover_image: data.coverImage || undefined,
          pdf_url: data.format === "pdf" ? data.content : undefined,
          author_id: req.user!.id,
          workshop_id: undefined,
          is_premium: data.isPremium,
          is_published: true,
        } as any);

        if (!newComic) {
          console.error("Failed to create comic", { title: data.title, author_id: req.user!.id });
          return res.status(500).json({ message: "Failed to create comic" });
        }
        return res.status(201).json({ message: "Comic published successfully", comic: newComic });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error("Publish error", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Bookmark routes
  app.post("/api/stories/:id/bookmark", requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.id, 10);
    if (isNaN(storyId)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }
    
    const story = await supabaseStorage.getStory(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    try {
      const userId = req.user!.id;
      
      // Check if already bookmarked
      const existingBookmark = await supabaseStorage.getBookmark(userId, storyId);
      
      if (existingBookmark) {
        return res.status(400).json({ message: "Story already bookmarked" });
      }
      
      const bookmark = await supabaseStorage.createBookmark({ user_id: userId, story_id: storyId });
      
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
      const userId = req.user!.id;
      const deleted = await supabaseStorage.deleteBookmark(userId, storyId);
      
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
      const userId = req.user!.id;
      const stories = await supabaseStorage.getBookmarks(userId);
      
      // Add rating and genre information to each story
      const storiesWithDetails = await Promise.all(
        stories.map(async (story) => {
          const averageRating = await supabaseStorage.getAverageRating(story.id);
          const genres = await supabaseStorage.getStoryGenres(story.id);
          const author = await supabaseStorage.getUser(story.author_id);
          
          // Don't include the full content in list responses
          const { content, ...storyWithoutContent } = story;
          
          return {
            ...storyWithoutContent,
            averageRating,
            genres,
            author: author ? {
              id: author.id,
              username: author.username,
              fullName: author.full_name,
              avatarUrl: author.avatar_url
            } : null
          };
        })
      );
      
      res.json(storiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tales of Prophets content endpoints
  app.get("/api/tales-of-prophets", async (req, res) => {
    try {
      const content = await supabaseStorage.getTalesOfProphetsContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching tales content:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tales-of-prophets/prophets", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const tale = await supabaseStorage.addProphetTale(req.body);
      res.json(tale);
    } catch (error) {
      console.error("Error adding prophet tale:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tales-of-prophets/companions", requireAuth, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
      const tale = await supabaseStorage.addCompanionTale(req.body);
      res.json(tale);
    } catch (error) {
      console.error("Error adding companion tale:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
