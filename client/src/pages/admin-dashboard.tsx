import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, Lock, Unlock, Star, StarOff, Trash2, History, LogOut } from "lucide-react";

interface Meme {
  id: string;
  title: string;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  editedByUsers?: number;
  isLocked?: boolean;
  isFeatured?: boolean;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Get admin token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return {
      "Authorization": `Bearer ${token}`,
    };
  };

  // Fetch memes
  const { data: memes, isLoading } = useQuery<Meme[]>({
    queryKey: ["/api/memes"],
    queryFn: async () => {
      const res = await fetch("/api/memes?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch memes");
      return res.json();
    },
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Upload failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${data.count} memes`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/memes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Meme deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
    },
  });

  // Lock mutation
  const lockMutation = useMutation({
    mutationFn: async ({ id, isLocked }: { id: string; isLocked: boolean }) => {
      const res = await fetch(`/api/admin/memes/${id}/lock`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked }),
      });
      if (!res.ok) throw new Error("Lock operation failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
    },
  });

  // Feature mutation
  const featureMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const res = await fetch(`/api/admin/memes/${id}/feature`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      });
      if (!res.ok) throw new Error("Feature operation failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleBulkUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    bulkUploadMutation.mutate(selectedFiles, {
      onSettled: () => setUploading(false),
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("isAdmin");
    setLocation("/");
  };

  if (isLoading) {
    return <div className="text-center mt-10">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage memes, bulk upload, and moderate content
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="manage">Manage Memes</TabsTrigger>
          </TabsList>

          {/* Bulk Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Bulk Upload Memes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bulk-upload"
                  />
                  <label
                    htmlFor="bulk-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <p className="text-lg font-medium">
                      Click to select images
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Select multiple images to upload at once (max 50)
                    </p>
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">
                      {selectedFiles.length} file(s) selected
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBulkUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {uploading ? "Uploading..." : `Upload ${selectedFiles.length} Meme(s)`}
                </Button>

                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                  <p className="font-medium mb-1">ℹ️ Default Metadata</p>
                  <p>All uploaded memes will have:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Name: "memename"</li>
                    <li>Tags: ["memetag"]</li>
                  </ul>
                  <p className="mt-2">
                    Users can edit these later through the community contribution system.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Memes Tab */}
          <TabsContent value="manage" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memes && memes.length > 0 ? (
                memes.map((meme) => (
                  <Card key={meme.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={meme.imageUrl}
                        alt={meme.title}
                        className="w-full h-full object-cover"
                      />
                      {meme.isFeatured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500">
                          Featured
                        </Badge>
                      )}
                      {meme.isLocked && (
                        <Badge className="absolute top-2 left-2 bg-red-500">
                          Locked
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold truncate">{meme.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {meme.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {meme.editedByUsers !== undefined && meme.editedByUsers > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {meme.editedByUsers} community edit(s)
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            lockMutation.mutate({
                              id: meme.id,
                              isLocked: !meme.isLocked,
                            })
                          }
                          className="flex items-center gap-1"
                        >
                          {meme.isLocked ? (
                            <>
                              <Unlock className="w-3 h-3" />
                              Unlock
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              Lock
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            featureMutation.mutate({
                              id: meme.id,
                              isFeatured: !meme.isFeatured,
                            })
                          }
                          className="flex items-center gap-1"
                        >
                          {meme.isFeatured ? (
                            <>
                              <StarOff className="w-3 h-3" />
                              Unfeature
                            </>
                          ) : (
                            <>
                              <Star className="w-3 h-3" />
                              Feature
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this meme?")) {
                              deleteMutation.mutate(meme.id);
                            }
                          }}
                          className="flex items-center gap-1 col-span-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  No memes found. Upload some memes to get started!
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
