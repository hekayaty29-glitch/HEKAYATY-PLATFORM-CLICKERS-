// Extended types for frontend use

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  avatarUrl: string;
  isPremium: boolean;
  isAuthor: boolean;
}

export interface StoryAuthor {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
}

export interface Genre {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface StoryCard {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  authorId: number;
  isPremium: boolean;
  isPublished: boolean;
  isShortStory: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  ratingCount?: number;
  genres: Genre[];
  author: StoryAuthor | null;
}

export interface StoryDetail extends StoryCard {
  content: string;
  isBookmarked: boolean;
}

export interface Rating {
  id: number;
  userId: number;
  storyId: number;
  rating: number;
  review: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string;
  };
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface PublishStoryFormData {
  title: string;
  description: string;
  content: string;
  coverImage: string;
  isPremium: boolean;
  isShortStory: boolean;
  isPublished: boolean;
  genreIds: number[];
}

export interface UserProfileUpdate {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface RatingFormData {
  rating: number;
  review: string;
}

export interface GenreFilter {
  id: number;
  name: string;
  icon: string;
}
