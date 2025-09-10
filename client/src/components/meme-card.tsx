import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Eye, Edit2, Trash2, Save, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { type Meme } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DownloadButton from "./download-button";

interface MemeCardProps {
  meme: Meme;
}

export default function MemeCard({ meme }: MemeCardProps) {
  const [location] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(meme.title);
  const [editTags, setEditTags] = useState(meme.tags.join(", "));
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only show admin controls if on /admin-dashboard and isAdmin is true
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("isAdmin") === "true";
  const showAdminControls = isAdmin && location === "/admin-dashboard";

  // Update meme mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: { title: string; tags: string[] }) => {
      const formData = new FormData();
      formData.append("title", updates.title);
      formData.append("tags", updates.tags.join(","));
      // PATCH to /api/memes/:id/rename
      const response = await fetch(`/api/memes/${meme.id}/rename`, {
        method: "PATCH",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to rename meme");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meme updated",
        description: "The meme has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      if (error.message.includes('404')) {
        toast({
          title: "Meme not found",
          description: "This meme no longer exists. Refreshing list...",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      } else {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Delete meme mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/memes/${meme.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meme deleted",
        description: "The meme has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
    },
    onError: (error: Error) => {
      if (error.message.includes('404')) {
        toast({
          title: "Meme not found",
          description: "This meme was already deleted. Refreshing list...",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      } else {
        toast({
          title: "Delete failed",
          description: error.message,
          variant: "destructive",
        });
      }
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

    updateMutation.mutate({ title: editTitle.trim(), tags });
  };

  const handleCancelEdit = () => {
    setEditTitle(meme.title);
    setEditTags(meme.tags.join(", "));
    setIsEditing(false);
  };

  const formatDate = (date: Date) => {
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
  };

  return (
    <Card className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group border-border flex flex-col h-full">
      <div className="relative aspect-square overflow-hidden flex-shrink-0">
        <Link href={`/meme/${meme.id}`} data-testid={`link-preview-${meme.id}`}>
          <div className="cursor-pointer w-full h-full">
            <img
              src={meme.imageUrl}
              alt={meme.title}
              className="w-full h-full object-cover"
              loading="lazy"
              data-testid={`img-meme-${meme.id}`}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
        </Link>
        
        {/* Admin controls only on admin dashboard */}
        {showAdminControls && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={isEditing}
              className="w-8 h-8 bg-black/50 hover:bg-secondary text-white rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              data-testid={`button-edit-${meme.id}`}
            >
              <Edit2 size={12} />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  className="w-8 h-8 bg-black/50 hover:bg-destructive text-white rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  data-testid={`button-delete-${meme.id}`}
                >
                  <Trash2 size={12} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Delete Meme</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Are you sure you want to delete "{meme.title}"? This action cannot be undone and will permanently remove the meme from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    data-testid={`button-confirm-delete-${meme.id}`}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        {/* Title - Editable for admins */}
        {isEditing ? (
          <div className="space-y-2 mb-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Meme title"
              className="bg-input border-border text-foreground text-sm font-semibold"
              data-testid={`input-edit-title-${meme.id}`}
            />
            <Input
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="bg-input border-border text-foreground text-xs"
              data-testid={`input-edit-tags-${meme.id}`}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid={`button-save-${meme.id}`}
              >
                <Save size={12} className="mr-1" />
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                className="flex-1 border-border text-foreground hover:bg-muted"
                data-testid={`button-cancel-edit-${meme.id}`}
              >
                <X size={12} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 
              className="font-semibold text-foreground mb-2 line-clamp-2" 
              title={meme.title}
              data-testid={`text-title-${meme.id}`}
            >
              {meme.title}
            </h3>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {meme.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground text-xs px-2 py-1"
                  data-testid={`tag-${tag}-${meme.id}`}
                >
                  {tag}
                </Badge>
              ))}
              {meme.tags.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 text-muted-foreground border-muted"
                >
                  +{meme.tags.length - 3}
                </Badge>
              )}
            </div>
          </>
        )}
        
        <div className="flex-grow" />
        
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid={`text-date-${meme.id}`}>
              {formatDate(new Date(meme.createdAt))}
            </span>
          </div>
          
          {/* Download button fixed at bottom */}
          <DownloadButton
            imageUrl={meme.imageUrl}
            filename={`${meme.title.replace(/[^a-zA-Z0-9\s]/g, '_').trim()}.jpg`}
            data-testid={`button-download-${meme.id}`}
          />
        </div>
      </div>
    </Card>
  );
}
