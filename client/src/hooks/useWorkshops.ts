import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Workshop {
  id: number;
  name: string;
  host_id: string;
  description: string | null;
  draft: string | null;
  cover_url: string | null;
  created_at: string;
  members: string[];
}

export interface WorkshopMessage {
  id: string;
  workshop_id: number;
  user_id: string;
  text: string | null;
  image_url: string | null;
  created_at: string;
}

const workshopsKey = ["workshops"];
const workshopKey = (id?: number) => ["workshop", id];

export function useWorkshops() {
  return useQuery<Workshop[]>({
    queryKey: workshopsKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_workshops_with_members");
      if (error) throw error;
      return data as Workshop[];
    },
  });
}

export function useWorkshop(id: number | undefined) {
  return useQuery<Workshop & { messages: WorkshopMessage[] }>({
    enabled: !!id,
    queryKey: workshopKey(id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_workshop_detail", { p_workshop_id: id });
      if (error) throw error;
      return data as any;
    },
  });
}

export function useJoinWorkshop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workshopId, userId }: { workshopId: number; userId: string }) => {
      const { error } = await supabase.from("workshop_members").insert({ workshop_id: workshopId, user_id: userId });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: (_, { workshopId }) => {
      qc.invalidateQueries({ queryKey: workshopKey(workshopId) });
      qc.invalidateQueries({ queryKey: workshopsKey });
    },
  });
}

export function useSendWorkshopMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workshopId, userId, text, imageUrl }: { workshopId: number; userId: string; text: string; imageUrl?: string }) => {
      const { error } = await supabase.from("workshop_messages").insert({ workshop_id: workshopId, user_id: userId, text: text || '', image_url: imageUrl ?? null });
      if (error) throw error;
    },
    onSuccess: (_, { workshopId }) => {
      qc.invalidateQueries({ queryKey: workshopKey(workshopId) });
    },
  });
}

export function useUpdateWorkshopDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workshopId, draft }: { workshopId: number; draft: string }) => {
      const { error } = await supabase.from("workshops").update({ draft }).eq("id", workshopId);
      if (error) throw error;
    },
    onSuccess: (_, { workshopId }) => {
      qc.invalidateQueries({ queryKey: workshopKey(workshopId) });
    },
  });
}

export function useRenameWorkshop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workshopId, name }: { workshopId: number; name: string }) => {
      const { error } = await supabase.from("workshops").update({ name }).eq("id", workshopId);
      if (error) throw error;
    },
    onSuccess: (_, { workshopId }) => {
      qc.invalidateQueries({ queryKey: workshopKey(workshopId) });
      qc.invalidateQueries({ queryKey: workshopsKey });
    },
  });
}

export function useAddWorkshop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, hostId }: { name: string; description?: string; hostId: string }) => {
      const { error } = await supabase.from("workshops").insert({ name, description: description ?? null, host_id: hostId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workshopsKey });
    },
  });
}

export function useUpdateWorkshopCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workshopId, url }: { workshopId: number; url: string }) => {
      const { error } = await supabase.from("workshops").update({ cover_url: url }).eq("id", workshopId);
      if (error) throw error;
    },
    onSuccess: (_, { workshopId }) => {
      qc.invalidateQueries({ queryKey: workshopKey(workshopId) });
      qc.invalidateQueries({ queryKey: workshopsKey });
    },
  });
}
