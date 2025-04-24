import React, { useState, useEffect } from "react";
import { ReaderSettings, ReaderPreferences } from "./ReaderSettings";
import { Button } from "@/components/ui/button";
import { BookOpen, Bookmark, Share2 } from "lucide-react";

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
  });

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

  // Generate the appropriate class names based on preferences
  const readerClasses = `
    reader-wrapper 
    reader-theme-${preferences.theme} 
    reader-font-${preferences.fontFamily} 
    reader-text-${preferences.fontSize}
  `;

  // Format content with proper paragraph breaks
  const formattedContent = content
    .split("\n\n")
    .map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ));

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

        {/* Story content */}
        <div className="reading-container">
          {formattedContent}
        </div>
      </div>
    </div>
  );
}

export default Reader;