import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Meme } from "@shared/schema";
import MemeCard from "./meme-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MemeGridProps {
  searchQuery?: string;
}

export default function MemeGrid({ searchQuery = "" }: MemeGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: memes = [], isLoading, error, refetch } = useQuery<Meme[]>({
    queryKey: ["/api/memes", { search: searchQuery, limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage }],
    retry: 2,
  });

  const totalPages = Math.ceil(memes.length / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load memes. 
            <Button 
              variant="link" 
              className="p-0 ml-2 text-destructive-foreground underline"
              onClick={() => refetch()}
              data-testid="button-retry"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
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
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-memes">
            {searchQuery ? "No memes found" : "No memes yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? `No memes match "${searchQuery}". Try a different search term.`
              : "Be the first to share a meme with the community!"
            }
          </p>
          <Button 
            onClick={() => window.location.href = '/upload'}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-upload-first"
          >
            Upload First Meme
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Grid Container with responsive columns */}
      <div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
        data-testid="meme-grid"
      >
        {memes.map((meme, idx) => (
          <MemeCard key={meme.id || idx} meme={meme} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-12">
          <Button
            variant="ghost"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            data-testid="button-prev-page"
          >
            <ChevronLeft className="mr-2" size={16} />Previous
          </Button>
          
          <div className="flex space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              const isActive = page === currentPage;
              return (
                <Button
                  key={page}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  data-testid={`button-page-${page}`}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="ghost"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-foreground hover:text-primary transition-colors disabled:opacity-50"
            data-testid="button-next-page"
          >
            Next<ChevronRight className="ml-2" size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
