import { Link } from 'wouter';

interface Comic {
  id: string;
  title: string;
  cover: string;
}

interface Props {
  comic: Comic;
}

export default function ComicCard({ comic }: Props) {
  return (
    <Link href={`/comic/${comic.id}`} className="block group bg-amber-50/10 rounded-lg overflow-hidden border border-amber-500 hover:shadow-lg transition-shadow">
      <img src={comic.cover} alt={comic.title} className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" />
      <div className="p-4">
        <h3 className="font-cinzel text-lg font-bold text-amber-50 mb-1 truncate group-hover:text-amber-300 transition-colors">
          {comic.title}
        </h3>
      </div>
    </Link>
  );
}
