import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Users, BookOpen, Award, Megaphone, DollarSign } from "lucide-react";

export default function AdminDashboardPage() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user?.isAdmin) {
    return <Redirect to="/" />;
  }

  // Fetch aggregate stats
  const { data: stats, isLoading } = useQuery<{users:number, travelers:number, lords:number, stories:number, revenue_month:number}>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-[#15100A] text-amber-50 py-20 px-4">
      <Helmet>
        <title>Admin Dashboard - Hekayaty</title>
      </Helmet>

      <div className="container mx-auto max-w-6xl space-y-12">
        <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-center mb-8">Admin Dashboard</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 flex items-center gap-4">
            <Users className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-3xl font-bold">{isLoading ? "-" : stats?.users}</p>
              <p className="text-sm text-amber-200">Users</p>
            </div>
          </div>
          <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 flex items-center gap-4">
            <BookOpen className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-3xl font-bold">{isLoading ? "-" : stats?.stories}</p>
              <p className="text-sm text-amber-200">Stories</p>
            </div>
          </div>
          <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-3xl font-bold">{isLoading ? "-" : stats?.lords}</p>
              <p className="text-sm text-amber-200">Monthly Revenue ($)</p>
            </div>
          </div>
          <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 flex items-center gap-4">
            <Megaphone className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-3xl font-bold">{isLoading ? "-" : (((stats?.revenue_month ?? 0)/100).toLocaleString())}</p>
              <p className="text-sm text-amber-200">Revenue</p>
            </div>
          </div>
        </div>

        {/* Placeholder tables */}
        <div className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 overflow-auto">
          <h2 className="font-cinzel text-2xl mb-4">Recent Users</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-amber-300">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((id) => (
                <tr key={id} className="hover:bg-amber-900/50">
                  <td className="py-2 pr-4">{id}</td>
                  <td className="py-2 pr-4">User{id}</td>
                  <td className="py-2 pr-4">user{id}@example.com</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
