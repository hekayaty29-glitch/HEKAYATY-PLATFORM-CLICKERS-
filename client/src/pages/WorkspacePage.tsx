import { useAuth } from "@/lib/auth";
import { Helmet } from "react-helmet";
import { Redirect, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash2, UploadCloud } from "lucide-react";

interface Story {
  id: number;
  title: string;
  isPublished: boolean;
  createdAt: string;
  averageRating?: number;
}

export default function WorkspacePage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  const fetchMyStories = async (): Promise<Story[]> => {
    const res = await fetch(`/api/stories?authorId=${user.id}&includeDrafts=true`);
    if (!res.ok) throw new Error("Failed to fetch stories");
    return res.json();
  };

  const { data: stories, isLoading } = useQuery({
    queryKey: ["my-stories"],
    queryFn: fetchMyStories,
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/stories/${id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error("Publish failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-stories"] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/stories/${id}/unpublish`, { method: "POST" });
      if (!res.ok) throw new Error("Unpublish failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-stories"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-stories"] }),
  });

  const drafts = stories?.filter((s) => !s.isPublished) || [];
  const published = stories?.filter((s) => s.isPublished) || [];

  return (
    <div className="min-h-screen bg-[#15100A] text-amber-50 py-12 px-4">
      <Helmet>
        <title>My Workspace - Hekayaty</title>
      </Helmet>

      <div className="container mx-auto max-w-5xl space-y-12">
        <div className="flex items-center justify-between">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold">My Workspace</h1>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-brown-dark font-cinzel">
            <Link href="/publish">New Story</Link>
          </Button>
        </div>

        {/* Drafts */}
        <section>
          <h2 className="font-cinzel text-2xl mb-4">Drafts</h2>
          {isLoading ? (
            <p>Loading…</p>
          ) : drafts.length === 0 ? (
            <p className="text-amber-200">No drafts yet.</p>
          ) : (
            <ul className="space-y-4">
              {drafts.map((story) => (
                <li key={story.id} className="bg-amber-50/10 p-4 rounded-lg flex justify-between items-center">
                  <span>{story.title}</span>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" asChild>
                      <Link href={`/publish?edit=${story.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => publishMutation.mutate(story.id)}>
                      <UploadCloud className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => deleteMutation.mutate(story.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Published */}
        <section>
          <h2 className="font-cinzel text-2xl mb-4">Published</h2>
          {isLoading ? (
            <p>Loading…</p>
          ) : published.length === 0 ? (
            <p className="text-amber-200">No published stories yet.</p>
          ) : (
            <ul className="space-y-4">
              {published.map((story) => (
                <li key={story.id} className="bg-amber-50/10 p-4 rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{story.title}</span>
                    {story.averageRating && (
                      <span className="text-sm text-amber-400 font-medium flex items-center gap-1"><Check className="h-3 w-3" />{story.averageRating.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" asChild>
                      <Link href={`/story/${story.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => unpublishMutation.mutate(story.id)}>
                      <UploadCloud className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
