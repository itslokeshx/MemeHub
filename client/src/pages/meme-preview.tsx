import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit2, Trash2, Save, X, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import DownloadButton from "@/components/download-button";
import MemeCard from "@/components/meme-card";
import { type Meme } from "@shared/schema";

export default function MemePreview() {
  const [, params] = useRoute("/meme/:id");
  const [, navigate] = useLocation();
  const memeId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");

  // Check if user is admin
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("isAdmin") === "true";

  // Scroll to top when meme changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [memeId]);

  // Fetch specific meme
  const { data: meme, isLoading: memeLoading, error: memeError } = useQuery<Meme & { editedByUsers?: number; isLocked?: boolean; isFeatured?: boolean }>({
    queryKey: [`/api/memes/${memeId}`],
    enabled: !!memeId,
  });

  // Update edit fields when meme loads
  useEffect(() => {
    if (meme) {
      setEditTitle(meme.title || "");
      setEditTags(meme.tags?.join(", ") || "");
    }
  }, [meme]);

  // Fetch all memes for suggestions (excluding current meme)
  const { data: allMemes = [], isLoading: suggestionsLoading } = useQuery<Meme[]>({
    queryKey: ["/api/memes"],
  });

  const suggestedMemes = allMemes
    .filter(m => m?.id !== memeId)
    .slice(0, 20);

  // User edit mutation
  const userEditMutation = useMutation({
    mutationFn: async (updates: { name: string; tags: string[] }) => {
      const response = await fetch(`/api/memes/${memeId}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to edit meme");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meme updated",
        description: "Thank you for your contribution!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/memes/${memeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation (admin only)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/memes/${memeId}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Delete failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meme deleted",
        description: "The meme has been deleted successfully",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      toast({
        title: "Invalid title",
        description: "Title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const tags = editTags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    userEditMutation.mutate({ name: editTitle.trim(), tags });
  };

  const formatDate = (dateValue: string | Date | undefined) => {
    try {
      if (!dateValue) return "Unknown date";

      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
      }).format(date);
    } catch (error) {
      return "Unknown date";
    }
  };

  const createSafeFilename = (title: string | undefined) => {
    if (!title) return "meme.jpg";
    return `${title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
  };

  if (memeError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Meme Not Found</h1>
          <p className="text-muted-foreground mb-6">The meme you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <ArrowLeft size={16} className="mr-2" />
              Back to Gallery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-foreground hover:bg-muted"
              data-testid="button-back-to-gallery"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Gallery
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {memeLoading ? (
          <div className="space-y-6">
            <Skeleton className="w-full aspect-square max-h-[70vh] rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : meme ? (
          <>
            {/* Main meme display */}
            <div className="space-y-6 mb-12">
              <div className="relative">
                <img
                  src={meme.imageUrl || ''}
                  alt={meme.title || 'Meme'}
                  className="w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-lg"
                  data-testid={`img-preview-${meme.id}`}
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {meme.isFeatured && (
                    <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </Badge>
                  )}
                  {meme.isLocked && (
                    <Badge className="bg-red-500 text-white flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked
                    </Badge>
                  )}
                </div>
              </div>

              {/* Meme details */}
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Meme title"
                      className="text-2xl font-bold"
                    />
                    <Input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags (comma separated)"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEdit}
                        disabled={userEditMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save size={16} />
                        {userEditMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditTitle(meme.title || "");
                          setEditTags(meme.tags?.join(", ") || "");
                          setIsEditing(false);
                        }}
                        disabled={userEditMutation.isPending}
                      >
                        <X size={16} className="mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1
                      className="text-3xl font-bold text-foreground"
                      data-testid={`text-preview-title-${meme.id}`}
                    >
                      {meme.title || 'Untitled Meme'}
                    </h1>

                    <div className="flex flex-wrap gap-2">
                      {meme.tags && meme.tags.length > 0 ? (
                        meme.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                            data-testid={`tag-preview-${tag}-${meme.id}`}
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No tags</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span data-testid={`text-preview-date-${meme.id}`}>
                        Uploaded {formatDate(meme.createdAt)}
                      </span>
                      {meme.editedByUsers !== undefined && meme.editedByUsers > 0 && (
                        <span className="flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          {meme.editedByUsers} community edit{meme.editedByUsers > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <DownloadButton
                    imageUrl={meme.imageUrl || ''}
                    filename={createSafeFilename(meme.title)}
                    data-testid={`button-preview-download-${meme.id}`}
                  />

                  {/* Edit button (for all users if not locked) */}
                  {!meme.isLocked && !isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Edit2 size={16} />
                      Edit Meme
                    </Button>
                  )}

                  {/* Delete button (admin only) */}
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Meme</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{meme.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>

            {/* Suggested memes */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">More Memes</h2>

              {suggestionsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square w-full rounded-lg bg-muted" />
                      <div className="space-y-2 p-2">
                        <Skeleton className="h-4 w-3/4 bg-muted" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-12 rounded-full bg-muted" />
                          <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : suggestedMemes.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {suggestedMemes.map((suggestedMeme) => (
                    <MemeCard key={suggestedMeme.id} meme={suggestedMeme} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No other memes available</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No meme found</p>
            <Link href="/">
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                <ArrowLeft size={16} className="mr-2" />
                Back to Gallery
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}