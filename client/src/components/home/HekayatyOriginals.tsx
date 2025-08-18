import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import bgImg from "@/assets/571601e5-d155-4362-b446-db1c4302f71c.png";
import { Star, Search } from "lucide-react";
import { useState } from "react";

export interface OriginalStory {
  id: number;
  title: string;
  author: string;
  synopsis: string;
  cover: string; // emoji or url
  genre: string;
}

interface Props {
  stories?: OriginalStory[];
  showSearch?: boolean;
}

// Fetch originals
const useOriginalStories = () =>
  useQuery<OriginalStory[]>({
    queryKey: ["/api/stories/originals"],
    queryFn: async () => (await apiRequest("GET", "/api/stories/originals")).json(),
    staleTime: 1000 * 60 * 5,
  });

/* const defaultStories: OriginalStory[] = [
  {
    id: 1,
    title: "Chronicles of the Amber Throne",
    author: "Ayla Nightshade",
    synopsis:
      "An exiled princess must reclaim her kingdom with the help of a cursed knight and a rogue alchemist.",
    cover: "👑",
    genre: "Fantasy",
  },
  {
    id: 2,
    title: "Whispers in the Starlit Library",
    author: "Corvin Elderglen",
    synopsis:
      "In a library that appears only at midnight, a young scholar discovers books that rewrite reality itself.",
    cover: "📚",
    genre: "Mystery",
  },
  {
    id: 3,
    title: "The Last Ember Mage",
    author: "Selene Firesong",
    synopsis:
      "The final wielder of ember magic races against time to prevent an eternal winter summoned by ancient spirits.",
    cover: "🔥",
    genre: "Fantasy",
  },
*/

export default function HekayatyOriginals({ stories, showSearch = false }: Props) {
  const { data: fetched, isLoading } = useOriginalStories();
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  const originals = stories ?? fetched ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

  const genres = Array.from(new Set(originals.map((s) => s.genre)));

  const filtered = originals.filter((s) => {
    const matchGenre = selectedGenre === "all" || s.genre === selectedGenre;
    const matchTitle = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGenre && matchTitle;
  });

  if (isLoading) {
    return (
      <section
        className="relative py-16 px-4 bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <div className="container mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="animate-pulse bg-amber-50/10 rounded h-40" />
            ))}
        </div>
      </section>
    );
  }

  if (!originals.length) {
    return (
      <section
        className="relative py-16 px-4 text-center bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <Link href="/originals" className="group">
          <h3 className="font-cinzel text-2xl md:text-3xl text-amber-50 group-hover:text-amber-400 transition-colors">
            View All Originals
          </h3>
        </Link>
        <p className="font-cormorant italic mt-2 text-amber-200">No originals available yet. Check back soon!</p>
      </section>
    );
  }

  return (
    <section
      className="relative py-16 px-4 text-amber-50 bg-center bg-cover"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="absolute inset-0 bg-brown-dark/40" />
      <div className="relative container mx-auto max-w-6xl">
        {isAdmin && (
          <div className="flex justify-end mb-8 gap-4">
            <Link
              href="/publish"
              className="bg-amber-500 hover:bg-amber-600 text-amber-50 font-cinzel text-sm py-2 px-6 rounded-full transition-colors"
            >
              Publish Story
            </Link>
            <Link
              href="/publish-comic"
              className="bg-amber-500 hover:bg-amber-600 text-amber-50 font-cinzel text-sm py-2 px-6 rounded-full transition-colors"
            >
              Publish Comic
            </Link>
          </div>
        )}
        <div className="flex items-center justify-center mb-8 gap-3">
          <Star className="h-6 w-6 text-amber-500" />
          <Link href="/originals" className="hover:text-amber-400 transition-colors">
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-center">
              Hekayaty Originals
            </h2>
          </Link>
          <Star className="h-6 w-6 text-amber-500" />
        </div>

        {showSearch && (
          <div className="flex flex-col md:flex-row items-center gap-4 mb-12">
            <div className="relative w-full md:w-2/3">
              <input
                type="text"
                placeholder="Search by story title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
            </div>

            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="py-3 px-4 rounded-full bg-amber-50/10 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((story) => (
            <div
              key={story.id}
              className="story-card bg-amber-50 bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-lg p-6 border border-amber-500 hover:shadow-lg transition-all"
            >
              <div className="text-6xl mb-4 text-center">{story.cover}</div>
              <h3 className="font-cinzel text-2xl font-bold mb-2 text-amber-100 text-center">
                {story.title}
              </h3>
              <p className="text-amber-200 text-sm mb-1 text-center">{story.genre}</p>
              <p className="text-amber-200 text-xs mb-4 text-center">by {story.author}</p>
              <p className="text-amber-50 text-sm leading-relaxed mb-6 line-clamp-3">
                {story.synopsis}
              </p>
              <div className="flex justify-center">
                <Link
                  href={`/originals/${story.id}`}
                  className="bg-amber-500 hover:bg-amber-600 text-amber-50 font-cinzel text-sm py-2 px-6 rounded-full transition-colors"
                >
                  Read Story
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
