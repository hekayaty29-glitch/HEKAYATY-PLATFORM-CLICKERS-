import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ProfileHeader from "@/components/user/ProfileHeader";
import StoryCard from "@/components/story/StoryCard";
import { StoryCard as StoryCardType } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export default function UserProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const userId = params ? parseInt(params.id) : 0;
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;
  
  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  
  // Fetch user's authored stories
  const { data: authoredStories, isLoading: storiesLoading } = useQuery<StoryCardType[]>({
    queryKey: [`/api/stories?authorId=${userId}`],
    enabled: !!userId,
  });
  
  // Fetch user's bookmarked stories
  const { data: bookmarkedStories, isLoading: bookmarksLoading } = useQuery<StoryCardType[]>({
    queryKey: ['/api/bookmarks'],
    enabled: !!userId && isOwnProfile,
  });
  
  if (profileLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="animate-pulse">
          <div className="w-full h-36 rounded-lg bg-amber-200 mb-6"></div>
          <div className="w-1/3 h-8 bg-amber-200 rounded mb-2"></div>
          <div className="w-2/3 h-4 bg-amber-200 rounded mb-8"></div>
          <div className="w-full h-96 bg-amber-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10 text-center">
        <h1 className="text-2xl font-cinzel font-bold text-brown-dark">User Not Found</h1>
        <p className="mt-4 text-gray-600">The user profile you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{profile.fullName} - TaleKeeper</title>
        <meta name="description" content={`View ${profile.fullName}'s profile on TaleKeeper. Browse their stories and bookmarks.`} />
      </Helmet>
      
      <div className="bg-gradient-to-b from-amber-500/10 to-amber-50/20 pt-8 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          <ProfileHeader 
            user={profile} 
            isOwnProfile={isOwnProfile} 
            isPremium={profile.isPremium}
          />
          
          <Separator className="my-8 bg-amber-500/30" />
          
          <Tabs defaultValue="stories" className="w-full">
            <TabsList className="bg-amber-50 border border-amber-500/30">
              <TabsTrigger 
                value="stories" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              >
                Stories
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger 
                  value="bookmarks" 
                  className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                >
                  Bookmarks
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="about" 
                className="font-cinzel data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              >
                About
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stories" className="mt-6">
              {storiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg h-80"></div>
                  ))}
                </div>
              ) : authoredStories && authoredStories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {authoredStories.map(story => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                  <h3 className="font-cinzel text-lg text-brown-dark">No Stories Published Yet</h3>
                  <p className="text-gray-600 mt-2">
                    {isOwnProfile ? 
                      "You haven't published any stories yet. Start writing your first tale!" : 
                      `${profile.fullName} hasn't published any stories yet.`}
                  </p>
                </div>
              )}
            </TabsContent>
            
            {isOwnProfile && (
              <TabsContent value="bookmarks" className="mt-6">
                {bookmarksLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-white rounded-lg h-80"></div>
                    ))}
                  </div>
                ) : bookmarkedStories && bookmarkedStories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarkedStories.map(story => (
                      <StoryCard key={story.id} story={story} isBookmarked={true} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-amber-50/50 rounded-lg border border-amber-500/20">
                    <h3 className="font-cinzel text-lg text-brown-dark">No Bookmarks Yet</h3>
                    <p className="text-gray-600 mt-2">
                      You haven't bookmarked any stories yet. Explore and save stories to read later!
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
            
            <TabsContent value="about" className="mt-6">
              <div className="bg-amber-50/50 rounded-lg border border-amber-500/20 p-6">
                <h3 className="font-cinzel text-xl text-brown-dark mb-4">About {profile.fullName}</h3>
                {profile.bio ? (
                  <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
                ) : (
                  <p className="text-gray-500 italic">No bio provided yet.</p>
                )}
                
                <div className="mt-6">
                  <h4 className="font-cinzel text-lg text-brown-dark mb-2">Member Info</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      <span className="font-semibold">Username:</span> @{profile.username}
                    </li>
                    <li>
                      <span className="font-semibold">Membership:</span> {profile.isPremium ? 'Premium Member' : 'Free Member'}
                    </li>
                    <li>
                      <span className="font-semibold">Role:</span> {profile.isAuthor ? 'Author' : 'Reader'}
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
