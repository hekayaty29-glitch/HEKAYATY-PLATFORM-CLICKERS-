import HeroSection from "@/components/home/HeroSection";
import FeaturedStories from "@/components/home/FeaturedStories";
import TopRatedSection from "@/components/home/TopRatedSection";
import GenreExplorer from "@/components/home/GenreExplorer";
import MembershipSection from "@/components/home/MembershipSection";
import BeginJourney from "@/components/home/BeginJourney";
import { Helmet } from "react-helmet";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>TaleKeeper - Discover, Read & Publish Fantasy Stories</title>
        <meta name="description" content="Discover magical worlds of stories on TaleKeeper. Read and publish fantasy novels, short stories, and more." />
      </Helmet>
      
      <HeroSection />
      <FeaturedStories />
      <TopRatedSection />
      <GenreExplorer />
      <MembershipSection />
      <BeginJourney />
    </>
  );
}
