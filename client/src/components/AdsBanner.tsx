import { useRoles } from "@/hooks/useRoles";

export default function AdsBanner() {
  const { isFree } = useRoles();

  if (!isFree) return null;

  // This is just a placeholder; replace with real ad component or provider snippet.
  return (
    <div className="w-full bg-yellow-900/20 text-center py-3 text-sm text-yellow-300 font-medium"> 
      — Sponsored Ad —
    </div>
  );
}
