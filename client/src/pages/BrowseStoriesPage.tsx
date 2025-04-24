import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import StoryCard from "@/components/story/StoryCard";
import { StoryCard as StoryCardType, Genre } from "@/lib/types";
import { Search, SlidersHorizontal, FilterX, BookOpen, Award, Bookmark, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function BrowseStoriesPage() {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [pageTitle, setPageTitle] = useState("Browse Stories");
  const [pageDescription, setPageDescription] = useState("Discover fascinating stories from talented authors");
  const { isAuthenticated } = useAuth();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [storyType, setStoryType] = useState<string>("all");
  
  // Determine page mode (all stories, top-rated, or bookmarks)
  const isTopRated = location.includes("/top-rated");
  const isBookmarks = location.includes("/bookmarks");
  
  // Fetch genres
  const { data: genres } = useQuery<Genre[]>({
    queryKey: ["/api/genres"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch stories based on page mode
  const { data: stories, isLoading } = useQuery<StoryCardType[]>({
    queryKey: [
      isTopRated 
        ? "/api/stories/top-rated" 
        : isBookmarks 
          ? "/api/bookmarks" 
          : "/api/stories"
    ],
    enabled: !isBookmarks || isAuthenticated,
  });
  
  // Update page title and description based on mode
  useEffect(() => {
    if (isTopRated) {
      setPageTitle("Top Rated Stories");
      setPageDescription("Explore the highest rated stories on TaleKeeper");
    } else if (isBookmarks) {
      setPageTitle("My Library");
      setPageDescription("Your collection of bookmarked stories");
    } else {
      setPageTitle("Browse Stories");
      setPageDescription("Discover fascinating stories from talented authors");
    }
  }, [isTopRated, isBookmarks]);
  
  // Filter and sort stories
  const filteredStories = stories?.filter(story => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        story.title.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query) ||
        story.author?.fullName.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Apply genre filter
    if (selectedGenres.length > 0) {
      const storyGenreIds = story.genres.map(g => g.id);
      const hasSelectedGenre = selectedGenres.some(id => storyGenreIds.includes(id));
      if (!hasSelectedGenre) return false;
    }
    
    // Apply story type filter
    if (storyType === "novels" && story.isShortStory) return false;
    if (storyType === "short-stories" && !story.isShortStory) return false;
    
    return true;
  }) || [];
  
  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "rating":
        return b.averageRating - a.averageRating;
      default:
        return 0;
    }
  });
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setSelectedGenres([]);
    setStoryType("all");
  };
  
  // Handle genre selection
  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };
  
  return (
    <>
      <Helmet>
        <title>{pageTitle} - TaleKeeper</title>
        <meta name="description" content={pageDescription} />
      </Helmet>
      
      <div className="bg-gradient-to-b from-amber-500/5 to-amber-50/5 pt-8 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div>
              <h1 className="font-cinzel text-3xl font-bold text-brown-dark text-center md:text-left">{pageTitle}</h1>
              <p className="text-gray-600 mt-2 text-center md:text-left">{pageDescription}</p>
            </div>
            
            {!isBookmarks && (
              <div className="mt-4 md:mt-0 flex items-center">
                <Button 
                  variant="outline" 
                  className={`border-amber-500 ${isTopRated ? 'bg-amber-500 text-white' : 'text-brown-dark hover:bg-amber-500 hover:text-white'}`}
                  asChild
                >
                  <a href="/top-rated">
                    <Award className="mr-2 h-4 w-4" />
                    Top Rated
                  </a>
                </Button>
              </div>
            )}
          </div>
          
          {/* Filters */}
          <Card className="border-amber-500/30 bg-amber-50/80 mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Input
                    placeholder="Search stories by title, description, or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 border-amber-500/50 focus:border-amber-500"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-amber-500/50 text-brown-dark">
                        <BookOpen className="mr-2 h-4 w-4" />
                        {storyType === "all" ? "All Types" : storyType === "novels" ? "Novels" : "Short Stories"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-amber-50 border-amber-500/50">
                      <DropdownMenuLabel>Story Type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={storyType === "all"}
                        onCheckedChange={() => setStoryType("all")}
                      >
                        All Types
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={storyType === "novels"}
                        onCheckedChange={() => setStoryType("novels")}
                      >
                        Novels
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={storyType === "short-stories"}
                        onCheckedChange={() => setStoryType("short-stories")}
                      >
                        Short Stories
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-amber-500/50 text-brown-dark">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Genres
                        {selectedGenres.length > 0 && ` (${selectedGenres.length})`}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-amber-50 border-amber-500/50">
                      <DropdownMenuLabel>Select Genres</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {genres?.map(genre => (
                        <DropdownMenuCheckboxItem
                          key={genre.id}
                          checked={selectedGenres.includes(genre.id)}
                          onCheckedChange={() => toggleGenre(genre.id)}
                        >
                          {genre.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Select
                    value={sortBy}
                    onValueChange={setSortBy}
                  >
                    <SelectTrigger className="w-[180px] border-amber-500/50 focus:border-amber-500">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-amber-50 border-amber-500/50">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="ghost" 
                    className="text-gray-500 hover:text-amber-800"
                    onClick={resetFilters}
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stories */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg h-80"></div>
              ))}
            </div>
          ) : sortedStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedStories.map(story => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  isBookmarked={isBookmarks}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-amber-50/50 rounded-lg border border-amber-500/20">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="font-cinzel text-xl text-brown-dark mb-2">
                {isBookmarks ? "Your Library is Empty" : "No Stories Found"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {isBookmarks 
                  ? "You haven't bookmarked any stories yet. Start exploring to add stories to your library."
                  : searchQuery || selectedGenres.length > 0 || storyType !== "all"
                    ? "No stories match your filters. Try adjusting your search criteria."
                    : "There are no stories available at the moment. Please check back later."}
              </p>
              
              {isBookmarks && (
                <Button asChild className="mt-6 bg-amber-500 hover:bg-amber-600">
                  <a href="/stories">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Stories
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
