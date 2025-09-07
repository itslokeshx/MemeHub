import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DownloadButtonProps {
  /** Direct image URL (Cloudinary URL) */
  imageUrl?: string;
  /** Meme ID to fetch from backend */
  memeId?: string;
  /** Custom filename for the download */
  filename?: string;
  /** Additional CSS classes */
  className?: string;
  /** Button size variant */
  size?: "sm" | "default" | "lg";
  /** Whether to show loading state */
  showLoading?: boolean;
}

/**
 * DownloadButton component that can download images either from:
 * 1. Direct imageUrl (Cloudinary URL) - creates direct download link
 * 2. Meme ID (uses backend download endpoint)
 * 
 * Uses simple <a> tag approach for reliable downloads across all browsers.
 * Automatically handles filename extraction and error states.
 */
export default function DownloadButton({
  imageUrl,
  memeId,
  filename,
  className = "",
  size = "default",
  showLoading = true
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  /**
   * Extracts filename from URL or uses provided filename
   */
  const getFilename = (url: string, customFilename?: string): string => {
    if (customFilename) {
      return customFilename;
    }
    
    try {
      // Extract filename from URL
      const urlPath = new URL(url).pathname;
      const urlFilename = urlPath.split('/').pop() || 'meme';
      
      // Remove query parameters and ensure proper extension
      const cleanFilename = urlFilename.split('?')[0];
      
      // If no extension, add .jpg as default
      if (!cleanFilename.includes('.')) {
        return `${cleanFilename}.jpg`;
      }
      
      return cleanFilename;
    } catch {
      return 'meme.jpg';
    }
  };

  /**
   * Downloads image from direct URL using simple link approach
   */
  const downloadFromUrl = async (url: string, downloadFilename: string): Promise<void> => {
    try {
      // Create a temporary download link directly to the URL
      const link = document.createElement('a');
      link.href = url; // Direct Cloudinary URL
      link.download = downloadFilename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay to ensure download starts
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Download from URL failed:', error);
      throw error;
    }
  };

  /**
   * Downloads image using meme ID via backend API
   */
  const downloadFromId = async (id: string, downloadFilename: string): Promise<void> => {
    try {
      // Use the backend download endpoint which redirects to Cloudinary URL
      const downloadUrl = `/api/memes/${id}/download`;
      
      // Create a temporary download link to the backend endpoint
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFilename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay to ensure download starts
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Download from ID failed:', error);
      throw error;
    }
  };

  /**
   * Main download handler
   */
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      let downloadUrl: string;
      let downloadFilename: string;
      
      if (imageUrl) {
        // Use direct URL
        downloadUrl = imageUrl;
        downloadFilename = getFilename(imageUrl, filename);
        await downloadFromUrl(downloadUrl, downloadFilename);
      } else if (memeId) {
        // Use meme ID
        downloadFilename = filename || 'meme.jpg';
        await downloadFromId(memeId, downloadFilename);
      } else {
        throw new Error('Either imageUrl or memeId must be provided');
      }
      
      // Success toast
      toast({
        title: "Download started",
        description: `Downloading ${downloadFilename}...`,
      });
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Simple error message for direct download approach
      const errorMessage = error instanceof Error ? error.message : "Failed to download the image. Please try again.";
      
      // Error toast
      toast({
        title: "Download failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Determine if we have valid props
  const hasValidProps = imageUrl || memeId;
  
  if (!hasValidProps) {
    console.warn('DownloadButton: Either imageUrl or memeId must be provided');
    return null;
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      size={size}
      className={`gap-2 whitespace-nowrap rounded-md text-sm h-10 px-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center space-x-2 ${className}`}
    >
      <Download 
        className={`h-4 w-4 ${isDownloading && showLoading ? 'animate-spin' : ''}`} 
      />
      <span>
        {isDownloading && showLoading ? 'Downloading...' : 'Download'}
      </span>
    </Button>
  );
}
