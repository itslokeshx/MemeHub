import { useLocation, useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DownloadButton from "@/components/download-button";
import { type Meme } from "@shared/schema";

export default function MemePreview() {
  const [, params] = useRoute("/meme/:id");
  const memeId = params?.id;

  // Fetch specific meme
  const { data: meme, isLoading: memeLoading, error: memeError } = useQuery<Meme>({
    queryKey: ["/api/memes", memeId],
    enabled: !!memeId,
  });

  // Fetch all memes for suggestions (excluding current meme)
  const { data: allMemes = [], isLoading: suggestionsLoading } = useQuery<Meme[]>({
    queryKey: ["/api/memes"],
  });

  const suggestedMemes = allMemes
    .filter(m => m?.id !== memeId)
    .slice(0, 8); // Show up to 8 suggestions

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
              </div>

              {/* Meme details */}
              <div className="space-y-4">
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

                <div className="flex items-center justify-between">
                  <span 
                    className="text-sm text-muted-foreground"
                    data-testid={`text-preview-date-${meme.id}`}
                  >
                    {formatDate(meme.createdAt)}
                  </span>
                  
                  <DownloadButton
                    imageUrl={meme.imageUrl || ''}
                    filename={createSafeFilename(meme.title)}
                    data-testid={`button-preview-download-${meme.id}`}
                  />
                </div>
              </div>
            </div>

            {/* Suggested memes */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">More Memes</h2>
              
              {suggestionsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : suggestedMemes.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                    {suggestedMemes.map((suggestedMeme) => (
                      <Link key={suggestedMeme.id} href={`/meme/${suggestedMeme.id}`}>
                        <Card className="w-48 bg-card hover:bg-muted transition-colors cursor-pointer border-border">
                          <div className="aspect-square overflow-hidden rounded-t-lg">
                            <img
                              src={suggestedMeme.imageUrl || ''}
                              alt={suggestedMeme.title || 'Meme'}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              data-testid={`img-suggestion-${suggestedMeme.id}`}
                            />
                          </div>
                          <div className="p-3">
                            <h3 
                              className="font-medium text-sm text-foreground line-clamp-2 mb-1"
                              title={suggestedMeme.title || 'Untitled'}
                              data-testid={`text-suggestion-title-${suggestedMeme.id}`}
                            >
                              {suggestedMeme.title || 'Untitled Meme'}
                            </h3>
                            <p 
                              className="text-xs text-muted-foreground"
                              data-testid={`text-suggestion-date-${suggestedMeme.id}`}
                            >
                              {formatDate(suggestedMeme.createdAt)}
                            </p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
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