import { Hammer, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const workshopStories = [
  {
    id: 301,
    title: "Forged in Starlight",
    author: "Eira Stormforge",
    cover: "",
  },
  {
    id: 302,
    title: "The Whispering Quill",
    author: "Rowan Inkweaver",
    cover: "",
  },
  {
    id: 303,
    title: "Chronicles of the Clockwork Garden",
    author: "Thalia Gearheart",
    cover: "",
  },
];

export default function TaleCraftSection() {
  const [search, setSearch] = useState("");

  const filtered = workshopStories.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-brown-dark to-midnight-blue text-amber-50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-center gap-3 mb-10">
          <Hammer className="h-6 w-6 text-amber-400" />
          <Link href="/talecraft" className="hover:text-amber-400 transition-colors">
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-center">
              TaleCraft Workshops
            </h2>
          </Link>
          <Hammer className="h-6 w-6 text-amber-400" />
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Search workshop stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="story-card bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center"
            >
              <div className="text-6xl mb-4">{story.cover}</div>
              <h4 className="font-cinzel text-xl font-bold text-amber-100 mb-1 text-center">
                {story.title}
              </h4>
              <p className="text-amber-200 text-sm text-center">by {story.author}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
