import { useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Temp data reused from CharactersSection (could be moved to shared store/API later)
const characters = [
  {
    id: 1,
    name: "Eldrin Starweaver",
    role: "Hero",
    image: "https://i.pravatar.cc/300?img=56",
    description:
      "Eldrin Starweaver is a wandering mage who weaves constellations into powerful spells. His past is shrouded in mystery, but tales whisper that he once saved the Moon Kingdom from eternal eclipse.",
    story: "Chronicles of the Celestial Loom",
    backstory:
      "Born beneath a comet's blaze, Eldrin discovered his gift to manipulate starlight at a young age. After losing his family to the Shadow Plague, he embarked on a quest to master the astral arts, determined to prevent such darkness from ever returning.",
  },
  // ... additional characters here
];

export default function CharacterDetailPage() {
  const [, params] = useRoute<{ id: string }>("/characters/:id");
  const id = Number(params?.id);
  const char = characters.find((c) => c.id === id);

  if (!char) {
    return <div className="text-amber-50 min-h-screen flex items-center justify-center">Character not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0704] text-amber-50 px-4 py-10">
      <Helmet>
        <title>{char.name} - Hekayaty Character</title>
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/characters" className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-400">
          <ArrowLeft className="h-4 w-4" /> Back to Characters
        </Link>

        <div className="flex flex-col md:flex-row gap-6 bg-[#1d140c]/60 backdrop-blur-sm border border-amber-700 rounded-lg p-6">
          <img src={char.image} alt={char.name} className="w-56 h-56 object-cover rounded-lg border-2 border-amber-600" />
          <div className="space-y-4">
            <h1 className="font-cinzel text-3xl text-amber-100">{char.name}</h1>
            <p className="italic text-amber-300">Role: {char.role}</p>
            <p className="text-amber-200 leading-relaxed">{char.description}</p>
            <h2 className="font-cinzel text-xl mt-4">Backstory</h2>
            <p className="text-amber-200 leading-relaxed whitespace-pre-line">{char.backstory}</p>
            <h2 className="font-cinzel text-xl mt-4">Story Appearances</h2>
            <p className="text-amber-200">{char.story}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
