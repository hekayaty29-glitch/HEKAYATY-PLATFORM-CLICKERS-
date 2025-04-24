import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import UserProfilePage from "@/pages/UserProfilePage";
import AuthorProfilePage from "@/pages/AuthorProfilePage";
import StoryPage from "@/pages/StoryPage";
import PublishStoryPage from "@/pages/PublishStoryPage";
import GenreStoriesPage from "@/pages/GenreStoriesPage";
import BrowseStoriesPage from "@/pages/BrowseStoriesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={SignInPage} />
      <Route path="/register" component={SignUpPage} />
      <Route path="/profile/:id" component={UserProfilePage} />
      <Route path="/author/:id" component={AuthorProfilePage} />
      <Route path="/story/:id" component={StoryPage} />
      <Route path="/publish" component={PublishStoryPage} />
      <Route path="/genres/:id" component={GenreStoriesPage} />
      <Route path="/genres" component={GenreStoriesPage} />
      <Route path="/stories" component={BrowseStoriesPage} />
      <Route path="/top-rated" component={BrowseStoriesPage} />
      <Route path="/bookmarks" component={BrowseStoriesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
