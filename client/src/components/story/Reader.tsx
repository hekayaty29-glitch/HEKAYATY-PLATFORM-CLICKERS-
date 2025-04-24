import React, { useState, useEffect, useRef } from "react";
import { ReaderSettings, ReaderPreferences } from "./ReaderSettings";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Bookmark, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  BookMarked
} from "lucide-react";

interface ReaderProps {
  title: string;
  author: string;
  content: string;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export function Reader({ title, author, content, onBookmark, isBookmarked = false }: ReaderProps) {
  // Reader preferences with defaults
  const [preferences, setPreferences] = useState<ReaderPreferences>({
    fontSize: "md",
    fontFamily: "serif",
    theme: "light",
    viewMode: "scroll",
  });
  
  // Track current page for paginated view
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Parse content into paragraphs
  const paragraphs = content.split("\n\n").filter(p => p.trim() !== "");
  
  // Calculate pages for paginated view (approximately)
  useEffect(() => {
    if (preferences.viewMode === "paginated" && contentRef.current) {
      // Very simple page calculation - each "page" is about 500 words
      const wordsPerPage = 500; 
      const wordCount = content.split(/\s+/).length;
      const calculatedPages = Math.max(1, Math.ceil(wordCount / wordsPerPage));
      setTotalPages(calculatedPages);
      // Reset to page 1 when switching to paginated mode
      setCurrentPage(1);
    }
  }, [preferences.viewMode, content]);
  
  // Track reading progress
  useEffect(() => {
    const trackProgress = () => {
      if (contentRef.current && preferences.viewMode === "scroll") {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        const contentTop = contentRef.current.offsetTop;
        const contentHeight = contentRef.current.scrollHeight;
        
        if (scrollTop >= contentTop) {
          const contentScrolled = scrollTop - contentTop;
          const progress = Math.min(100, Math.round((contentScrolled / (contentHeight - clientHeight)) * 100));
          setReadProgress(progress);
          
          // Save progress to localStorage
          localStorage.setItem(`reading-progress-${title}`, progress.toString());
        }
      }
    };
    
    window.addEventListener("scroll", trackProgress);
    return () => window.removeEventListener("scroll", trackProgress);
  }, [preferences.viewMode, title]);
  
  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem(`reading-progress-${title}`);
    if (savedProgress) {
      setReadProgress(parseInt(savedProgress));
      if (preferences.viewMode === "paginated") {
        const progressPercent = parseInt(savedProgress);
        const pageFromProgress = Math.ceil((progressPercent / 100) * totalPages);
        setCurrentPage(pageFromProgress || 1);
      }
    }
  }, [title, preferences.viewMode, totalPages]);

  // Get preferences from localStorage if available
  useEffect(() => {
    const savedPreferences = localStorage.getItem("reader-preferences");
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error("Failed to parse saved reader preferences");
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("reader-preferences", JSON.stringify(preferences));
  }, [preferences]);

  // Page navigation handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      const newProgress = Math.min(100, Math.round((currentPage / totalPages) * 100));
      setReadProgress(newProgress);
      localStorage.setItem(`reading-progress-${title}`, newProgress.toString());
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      const newProgress = Math.max(0, Math.round(((currentPage - 1) / totalPages) * 100));
      setReadProgress(newProgress);
      localStorage.setItem(`reading-progress-${title}`, newProgress.toString());
    }
  };

  // Generate the appropriate class names based on preferences
  const readerClasses = `
    reader-wrapper 
    reader-theme-${preferences.theme} 
    reader-font-${preferences.fontFamily} 
    reader-text-${preferences.fontSize}
    ${preferences.viewMode === "paginated" ? "reader-paginated" : ""}
  `;

  // Format content based on view mode
  const formattedContent = preferences.viewMode === "paginated" 
    ? renderPaginatedContent() 
    : paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4">
          {paragraph}
        </p>
      ));
      
  // Helper function for paginated view
  function renderPaginatedContent() {
    // Simple pagination - just divide paragraphs into pages
    const itemsPerPage = Math.max(5, Math.ceil(paragraphs.length / totalPages));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, paragraphs.length);
    const currentPageParagraphs = paragraphs.slice(startIndex, endIndex);
    
    return currentPageParagraphs.map((paragraph, index) => (
      <p key={`page-${currentPage}-para-${index}`} className="mb-4">
        {paragraph}
      </p>
    ));
  }

  return (
    <div className="my-8">
      {/* Reader controls */}
      <div className="mb-4">
        <ReaderSettings 
          preferences={preferences} 
          onPreferencesChange={setPreferences} 
        />
      </div>

      {/* Story title and actions */}
      <div className={`${readerClasses} mb-8`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">By {author}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBookmark}
              title={isBookmarked ? "Remove bookmark" : "Bookmark this story"}
            >
              <Bookmark 
                className={`h-5 w-5 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} 
              />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              title="Share this story"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Reading progress indicator */}
        <div className="w-full bg-muted h-1 rounded-full mb-8">
          <div 
            className="bg-amber-500 h-1 rounded-full" 
            style={{ width: `${readProgress}%` }}
          ></div>
        </div>

        {/* Story content */}
        <div className="reading-container" ref={contentRef}>
          {formattedContent}
        </div>
        
        {/* Pagination controls - only show in paginated mode */}
        {preferences.viewMode === "paginated" && (
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-muted">
            <Button
              variant="outline"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="bg-amber-50 hover:bg-amber-100 border-amber-200"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            
            <Button
              variant="outline"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="bg-amber-50 hover:bg-amber-100 border-amber-200"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reader;