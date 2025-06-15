import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FlagsProvider, useFlag } from "@/lib/flags";
import { AuthProvider } from "./lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HekyChat from "@/components/chat/HekyChat";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import UserProfilePage from "@/pages/UserProfilePage";
import AuthorProfilePage from "@/pages/AuthorProfilePage";
import StoryPage from "@/pages/StoryPage";
import PublishStoryPage from "@/pages/PublishStoryPage";
import WorkspacePage from "@/pages/WorkspacePage";
import GenreStoriesPage from "@/pages/GenreStoriesPage";
import BrowseStoriesPage from "@/pages/BrowseStoriesPage";
import CommunityPage from "@/pages/CommunityPage";
import HekayatyOriginalStoriesPage from "@/pages/HekayatyOriginalStoriesPage";
import SpecialStoriesPage from "@/pages/SpecialStoriesPage";
import TaleCraftPage from "@/pages/TaleCraftPage";
import WritersGemsPage from "@/pages/WritersGemsPage";
import WhispersOfWordsPage from "@/pages/WhispersOfWordsPage";
import { RecommendationsPage, WalletPage, InvitePage, AnalyticsDashboardPage, ModerationDashboardPage } from "@/pages/ExtraFeaturePages";
import { InvoicesPage, AuditLogPage, WebhookQueuePage, MetricsPage } from "@/pages/ExtraAdminPages";
import BookBazaarPage from "@/pages/BookBazaarPage";
import HekayatyNewsPage from "@/pages/HekayatyNewsPage";
import TermsOfUsePage from "@/pages/TermsOfUsePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

function GuardedRoute({ flag, component: Component }: {flag: string; component: any}) {
  const enabled = useFlag(flag);
  return enabled ? <Component /> : <NotFound />;
}

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
      <Route path="/workspace" component={() => <GuardedRoute flag="workspace" component={WorkspacePage} />} />
      <Route path="/genres/:id" component={GenreStoriesPage} />
      <Route path="/genres" component={GenreStoriesPage} />
      <Route path="/stories" component={BrowseStoriesPage} />
      <Route path="/top-rated" component={BrowseStoriesPage} />
      <Route path="/bookmarks" component={BrowseStoriesPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/originals" component={HekayatyOriginalStoriesPage} />
      <Route path="/special" component={SpecialStoriesPage} />
      <Route path="/talecraft" component={TaleCraftPage} />
      <Route path="/gems" component={WritersGemsPage} />
      <Route path="/whispers" component={WhispersOfWordsPage} />
      <Route path="/bazaar" component={() => <GuardedRoute flag="store" component={BookBazaarPage} />} />
      <Route path="/recommendations" component={() => <GuardedRoute flag="recommendations" component={RecommendationsPage} />} />
      <Route path="/wallet" component={() => <GuardedRoute flag="wallet" component={WalletPage} />} />
      <Route path="/invite" component={() => <GuardedRoute flag="referrals" component={InvitePage} />} />
      <Route path="/analytics" component={() => <GuardedRoute flag="analytics" component={AnalyticsDashboardPage} />} />
      <Route path="/moderation" component={() => <GuardedRoute flag="moderation" component={ModerationDashboardPage} />} />
      <Route path="/invoices" component={() => <GuardedRoute flag="billing" component={InvoicesPage} />} />
      <Route path="/admin/audit" component={() => <GuardedRoute flag="audit" component={AuditLogPage} />} />
      <Route path="/admin/webhooks" component={() => <GuardedRoute flag="webhook_queue" component={WebhookQueuePage} />} />
      <Route path="/admin/metrics" component={() => <GuardedRoute flag="observability" component={MetricsPage} />} />
      <Route path="/news" component={HekayatyNewsPage} />
      <Route path="/terms" component={TermsOfUsePage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FlagsProvider>
        <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
              <HekyChat />
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
      </FlagsProvider>
    </QueryClientProvider>
  );
}

export default App;
