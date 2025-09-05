import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, X, CloudUpload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { uploadMeme } from "@/lib/api";
import Navbar from "@/components/navbar";

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadMeme,
    onSuccess: () => {
      toast({
        title: "Meme uploaded successfully!",
        description: "Your meme has been added to MemeHub.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both an image and a title",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("title", title.trim());
    formData.append("tags", tags.trim());

    uploadMutation.mutate(formData);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4 text-muted-foreground hover:text-foreground"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload New Meme</h1>
          <p className="text-muted-foreground">
            Share your funniest memes with the MemeHub community
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Meme Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Meme Image</Label>
                
                {!selectedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      dragActive 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById("file-input")?.click()}
                    data-testid="upload-area"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                        dragActive ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <CloudUpload className={`text-xl ${dragActive ? "text-primary" : "text-muted-foreground"}`} size={24} />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                      data-testid="input-file"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={preview || ""}
                      alt="Preview"
                      className="w-full max-h-96 object-contain rounded-lg bg-muted"
                      data-testid="img-preview"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={clearFile}
                      className="absolute top-2 right-2"
                      data-testid="button-clear-file"
                    >
                      <X size={16} />
                    </Button>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-foreground">
                  Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter a catchy title for your meme..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input border-border text-foreground placeholder-muted-foreground focus:ring-ring"
                  maxLength={200}
                  data-testid="input-title"
                />
                <div className="text-xs text-muted-foreground">
                  {title.length}/200 characters
                </div>
              </div>

              {/* Tags Input */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium text-foreground">
                  Tags
                </Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="funny, programming, cat (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-input border-border text-foreground placeholder-muted-foreground focus:ring-ring"
                  data-testid="input-tags"
                />
                <p className="text-xs text-muted-foreground">
                  Add tags to help others find your meme. Separate multiple tags with commas.
                </p>
              </div>

              {/* Error Display */}
              {uploadMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {uploadMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex-1 border-border text-foreground hover:bg-muted"
                  disabled={uploadMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || !title.trim() || uploadMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                  data-testid="button-upload-submit"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Upload className="mr-2 animate-spin" size={16} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2" size={16} />
                      Upload Meme
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
