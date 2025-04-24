import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Star, 
  StarHalf, 
  Bookmark, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Share2, 
  AlertTriangle
} from "lucide-react";
import { StoryDetail, Rating } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn, formatDate, calculateReadTime, getRatingStars } from "@/lib/utils";
import { Reader } from "@/components/story/Reader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const ratingFormSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().max(500),
});

export default function StoryPage() {
  const [, params] = useRoute("/story/:id");
  const storyId = params ? parseInt(params.id) : 0;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const form = useForm<z.infer<typeof ratingFormSchema>>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      rating: 0,
      review: "",
    },
  });
  
  // Fetch story details
  const { data: story, isLoading, error } = useQuery<StoryDetail>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!storyId,
  });
  
  // Fetch story ratings
  const { data: ratings } = useQuery<Rating[]>({
    queryKey: [`/api/stories/${storyId}/ratings`],
    enabled: !!storyId,
  });
  
  // Update state when story data is loaded
  useEffect(() => {
    if (story) {
      setIsBookmarked(story.isBookmarked);
    }
  }, [story]);
  
  // Find user's existing rating if any
  useEffect(() => {
    if (ratings && user) {
      const userRating = ratings.find(r => r.userId === user.id);
      if (userRating) {
        setSelectedRating(userRating.rating);
        form.setValue("rating", userRating.rating);
        form.setValue("review", userRating.review);
      }
    }
  }, [ratings, user, form]);
  
  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        const res = await apiRequest("DELETE", `/api/stories/${storyId}/bookmark`, {});
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/stories/${storyId}/bookmark`, {});
        return res.json();
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: isBookmarked ? "Removed from library" : "Added to library",
        description: isBookmarked 
          ? "Story has been removed from your library" 
          : "Story has been added to your library",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  // Rating mutation
  const ratingMutation = useMutation({
    mutationFn: async (data: { rating: number; review: string }) => {
      const res = await apiRequest("POST", `/api/stories/${storyId}/rate`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/ratings`] });
      setShowRatingDialog(false);
      toast({
        title: "Rating submitted",
        description: "Thank you for rating this story!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rating failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  const handleBookmark = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark stories",
        variant: "destructive",
      });
      return;
    }
    
    bookmarkMutation.mutate();
  };
  
  const handleSetRating = (rating: number) => {
    setSelectedRating(rating);
    form.setValue("rating", rating);
  };
  
  const onSubmitRating = (data: z.infer<typeof ratingFormSchema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to rate stories",
        variant: "destructive",
      });
      return;
    }
    
    ratingMutation.mutate({
      rating: data.rating,
      review: data.review,
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="animate-pulse">
          <div className="w-2/3 h-10 bg-amber-200 rounded mb-4"></div>
          <div className="w-1/3 h-6 bg-amber-200 rounded mb-6"></div>
          <div className="w-full h-96 bg-amber-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !story) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-cinzel font-bold text-brown-dark">Story Not Found</h1>
        <p className="mt-4 text-gray-600">The story you're looking for doesn't exist or has been removed.</p>
        <Button asChild className="mt-6 bg-amber-500 hover:bg-amber-600">
          <Link href="/stories">
            <a>Browse Stories</a>
          </Link>
        </Button>
      </div>
    );
  }
  
  const readTime = calculateReadTime(story.content);
  const starsRating = getRatingStars(story.averageRating);
  
  return (
    <>
      <Helmet>
        <title>{story.title} - TaleKeeper</title>
        <meta name="description" content={story.description} />
      </Helmet>
      
      <div className="bg-gradient-to-b from-amber-500/5 to-amber-50/10 pt-8 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Story Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="md:w-1/3">
              <img 
                src={story.coverImage || "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                alt={`Cover for ${story.title}`} 
                className="w-full h-auto object-cover rounded-lg shadow-lg" 
              />
            </div>
            
            <div className="md:w-2/3">
              <div className="flex flex-wrap gap-2 mb-3">
                {story.genres.map((genre) => (
                  <Link key={genre.id} href={`/genres/${genre.id}`}>
                    <a className={cn(
                      "text-xs font-cinzel text-white px-2 py-1 rounded",
                      genre.id % 2 === 0 ? "bg-amber-500" : "bg-amber-800"
                    )}>
                      {genre.name}
                    </a>
                  </Link>
                ))}
                {story.isPremium && (
                  <span className="text-xs font-cinzel text-white px-2 py-1 rounded bg-gold-rich">
                    Premium
                  </span>
                )}
              </div>
              
              <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-brown-dark mb-3">
                {story.title}
              </h1>
              
              <div className="flex items-center mb-4">
                <div className="flex text-amber-500 mr-3">
                  {starsRating.map((star, i) => (
                    star === 'full' ? 
                      <Star key={i} className="h-5 w-5 fill-current" /> : 
                      star === 'half' ? 
                        <StarHalf key={i} className="h-5 w-5 fill-current" /> : 
                        <Star key={i} className="h-5 w-5" />
                  ))}
                </div>
                <span className="text-gray-700">
                  {story.averageRating.toFixed(1)} ({story.ratingCount} ratings)
                </span>
              </div>
              
              <p className="text-gray-700 mb-5">{story.description}</p>
              
              <Link href={`/author/${story.author?.id}`}>
                <a className="flex items-center group mb-5">
                  <img 
                    src={story.author?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                    className="w-10 h-10 rounded-full object-cover" 
                    alt={`${story.author?.fullName}'s avatar`} 
                  />
                  <div className="ml-3">
                    <span className="block text-brown-dark font-medium group-hover:text-amber-700">
                      {story.author?.fullName}
                    </span>
                    <span className="text-sm text-gray-500">
                      Author
                    </span>
                  </div>
                </a>
              </Link>
              
              <div className="flex flex-wrap items-center text-gray-600 text-sm gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Published {formatDate(story.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{readTime} min read</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className={cn(
                    "border-amber-500 text-brown-dark bg-transparent hover:bg-amber-500 hover:text-white",
                    isBookmarked && "bg-amber-500 text-white"
                  )}
                  onClick={handleBookmark}
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  {isBookmarked ? "Saved to Library" : "Add to Library"}
                </Button>
                
                <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-amber-500 text-brown-dark bg-transparent hover:bg-amber-500 hover:text-white">
                      <Star className="mr-2 h-4 w-4" />
                      Rate this Story
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-amber-50 border-amber-500">
                    <DialogHeader>
                      <DialogTitle className="font-cinzel text-brown-dark">Rate this Story</DialogTitle>
                      <DialogDescription>
                        Share your thoughts on "{story.title}"
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitRating)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-cinzel">Your Rating</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      className="text-amber-500 hover:text-amber-600 focus:outline-none"
                                      onClick={() => handleSetRating(rating)}
                                    >
                                      <Star 
                                        className={cn(
                                          "h-8 w-8", 
                                          rating <= selectedRating ? "fill-current" : ""
                                        )} 
                                      />
                                    </button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="review"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-cinzel">Your Review (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Share your thoughts about this story..." 
                                  className="h-32 border-amber-500/50 focus:border-amber-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            disabled={ratingMutation.isPending || selectedRating === 0}
                          >
                            Submit Rating
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" className="border-amber-500 text-brown-dark bg-transparent hover:bg-amber-500 hover:text-white">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className="my-8 bg-amber-500/30" />
          
          {/* Story Content with Customizable Reader */}
          <div className="flex flex-col-reverse lg:flex-row gap-8">
            <div className="lg:w-3/4">
              {/* Use the new Reader component */}
              <Reader 
                title={story.title}
                author={story.author?.fullName || "Unknown Author"}
                content={story.content}
                isBookmarked={isBookmarked}
                onBookmark={handleBookmark}
              />
            </div>
            
            <div className="lg:w-1/4">
              <div className="sticky top-4">
                <Card className="border-amber-500/30 shadow-sm bg-amber-50/60 mb-6">
                  <CardContent className="p-4">
                    <h3 className="font-cinzel text-lg font-bold text-brown-dark mb-3">Reader Reviews</h3>
                    
                    {ratings && ratings.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {ratings.slice(0, 5).map((rating) => (
                          <div key={rating.id} className="pb-3 border-b border-amber-500/20 last:border-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center">
                                <img 
                                  src={rating.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                                  className="w-7 h-7 rounded-full object-cover" 
                                  alt={`${rating.user?.fullName}'s avatar`} 
                                />
                                <span className="ml-2 text-sm font-medium text-brown-dark">
                                  {rating.user?.fullName}
                                </span>
                              </div>
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={cn(
                                      "h-3 w-3", 
                                      i < rating.rating ? "fill-current" : ""
                                    )} 
                                  />
                                ))}
                              </div>
                            </div>
                            {rating.review && (
                              <p className="text-sm text-gray-600 mt-1">
                                {rating.review}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(rating.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No reviews yet. Be the first to review this story!
                      </p>
                    )}
                    
                    {ratings && ratings.length > 5 && (
                      <Button 
                        variant="link" 
                        className="text-amber-500 hover:text-amber-700 p-0 h-auto mt-2"
                      >
                        View all {ratings.length} reviews
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                {story.author && (
                  <Card className="border-amber-500/30 shadow-sm bg-amber-50/60">
                    <CardContent className="p-4">
                      <h3 className="font-cinzel text-lg font-bold text-brown-dark mb-3">About the Author</h3>
                      
                      <Link href={`/author/${story.author.id}`}>
                        <a className="flex items-center group mb-3">
                          <img 
                            src={story.author.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                            className="w-12 h-12 rounded-full object-cover" 
                            alt={`${story.author.fullName}'s avatar`} 
                          />
                          <div className="ml-3">
                            <span className="block text-brown-dark font-medium group-hover:text-amber-700">
                              {story.author.fullName}
                            </span>
                            <span className="text-sm text-gray-500">
                              Author
                            </span>
                          </div>
                        </a>
                      </Link>
                      
                      {story.author.bio ? (
                        <p className="text-sm text-gray-600 mb-4">
                          {story.author.bio.length > 150 
                            ? `${story.author.bio.substring(0, 150)}...` 
                            : story.author.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic mb-4">
                          This author hasn't added a bio yet.
                        </p>
                      )}
                      
                      <Button 
                        asChild
                        variant="outline" 
                        className="w-full border-amber-500 text-brown-dark hover:bg-amber-500 hover:text-white"
                      >
                        <Link href={`/author/${story.author.id}`}>
                          <a>View Profile</a>
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
