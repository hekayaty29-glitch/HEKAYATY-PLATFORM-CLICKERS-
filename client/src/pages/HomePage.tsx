import HeroSection from "@/components/home/HeroSection";
import MembershipSection from "@/components/home/MembershipSection";
import BeginJourney from "@/components/home/BeginJourney";
import HekayatyOriginals from "@/components/home/HekayatyOriginals";
import SpecialStories from "@/components/home/SpecialStories";
import TaleCraftSection from "@/components/home/TaleCraftSection";
import WritersGemsSection from "@/components/home/WritersGemsSection";
import BookBazaarSection from "@/components/home/BookBazaarSection";
import AllStoriesSection from "@/components/home/AllStoriesSection";
import SectionDivider from "@/components/home/SectionDivider";
import WhispersOfWordsSection from "@/components/home/WhispersOfWordsSection";
import { Helmet } from "react-helmet";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#15100A]">
      <Helmet>
        <title>HEKAYATY - Discover, Read & Publish Fantasy Stories</title>
        <meta name="description" content="Discover magical worlds of stories on HEKAYATY. Read and publish fantasy novels, short stories, and more." />
      </Helmet>
      
      <div className="space-y-20">
        <HeroSection />
        <SectionDivider />
        <HekayatyOriginals />
        <SectionDivider />
        <WhispersOfWordsSection />
        <SectionDivider />
        <SpecialStories />
        <SectionDivider />
        <TaleCraftSection />
        <SectionDivider />
        <WritersGemsSection />
        <SectionDivider />
        <BookBazaarSection />
        <SectionDivider />
        <AllStoriesSection />
        <SectionDivider />
        <MembershipSection />
        <SectionDivider />
        <BeginJourney />
      </div>
    </div>
  );
}
