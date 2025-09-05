import { useQuery } from "@tanstack/react-query";
import MemeCard from "@/components/meme-card";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  // Fetch memes
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/memes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/memes");
      return res.json();
    },
  });

  if (isLoading) return <div className="text-center mt-10">Loading memes...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Failed to load memes</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-center flex-1">Admin Meme Management</h2>
        <button
          className="ml-4 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors font-medium"
          onClick={() => {
            localStorage.removeItem("isAdmin");
            setLocation("/");
          }}
          data-testid="button-admin-dashboard-logout"
        >
          Logout
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {data && data.length > 0 ? (
          data.map((meme: any, idx: number) => <MemeCard key={meme.id || idx} meme={meme} />)
        ) : (
          <div className="col-span-full text-center text-muted-foreground">No memes found.</div>
        )}
      </div>
    </div>
  );
}
