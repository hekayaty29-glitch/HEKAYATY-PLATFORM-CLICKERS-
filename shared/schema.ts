import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("fullName").notNull(),
  bio: text("bio").default(""),
  avatarUrl: text("avatarUrl").default(""),
  isPremium: boolean("isPremium").default(false),
  isAuthor: boolean("isAuthor").default(false),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  coverImage: text("coverImage").default(""),
  authorId: integer("authorId").notNull(),
  isPremium: boolean("isPremium").default(false),
  isPublished: boolean("isPublished").default(false),
  isShortStory: boolean("isShortStory").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const storyGenres = pgTable("storyGenres", {
  storyId: integer("storyId").notNull(),
  genreId: integer("genreId").notNull(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  storyId: integer("storyId").notNull(),
  rating: integer("rating").notNull(),
  review: text("review").default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  storyId: integer("storyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStorySchema = createInsertSchema(stories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGenreSchema = createInsertSchema(genres).omit({ id: true });
export const insertStoryGenreSchema = createInsertSchema(storyGenres);
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true });

// Select Types
export type User = typeof users.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Genre = typeof genres.$inferSelect;
export type StoryGenre = typeof storyGenres.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;

// Insert Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type InsertStoryGenre = z.infer<typeof insertStoryGenreSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

// Extended schemas for auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Story publishing schema with additional validations
export const publishStorySchema = insertStorySchema.extend({
  genreIds: z.array(z.number()).min(1, "At least one genre is required"),
  content: z.string().min(100, "Story content must be at least 100 characters"),
});
