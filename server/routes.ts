import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemeSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

/**
 * IMPORTANT: Cloudinary URL handling
 * 
 * Cloudinary URLs include version numbers in the format:
 * https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
 * 
 * When deleting images, we must extract the public_id WITHOUT the version number.
 * The extractCloudinaryPublicId() function handles this properly by:
 * 1. Splitting on '/upload/'
 * 2. Removing file extensions
 * 3. Removing version numbers (v\d+/)
 * 
 * This prevents "not found" errors when deleting images from Cloudinary.
 */

// Extend Express Request to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer with Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "memes",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  } as any,
});

const upload = multer({ 
  storage: cloudinaryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Utility function to extract public_id from Cloudinary URL
function extractCloudinaryPublicId(imageUrl: string): string | null {
  if (!imageUrl.includes("cloudinary.com")) {
    return null;
  }
  
  const parts = imageUrl.split('/upload/');
  if (parts.length !== 2) {
    throw new Error(`Invalid Cloudinary URL format: ${imageUrl}`);
  }
  
  let publicIdWithExt = parts[1];
  // Remove file extension
  const dotIdx = publicIdWithExt.lastIndexOf('.');
  if (dotIdx !== -1) {
    publicIdWithExt = publicIdWithExt.substring(0, dotIdx);
  }
  // Remove version number if present (starts with 'v' followed by digits)
  publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, '');
  
  // Validate public_id format
  if (!publicIdWithExt || publicIdWithExt.trim() === '') {
    throw new Error(`Invalid public_id extracted from URL: ${imageUrl}`);
  }
  
  return publicIdWithExt;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all memes with optional search and pagination
  app.get("/api/memes", async (req, res) => {
    try {
      const searchSchema = z.object({
        search: z.string().optional(),
        limit: z.string().optional(),
        offset: z.string().optional(),
      });

  const { search } = searchSchema.parse(req.query);
  const result = await storage.getMemes({ search });
  res.json(result);
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to fetch memes",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get single meme
  app.get("/api/memes/:id", async (req, res) => {
    try {
      const meme = await storage.getMeme(req.params.id);
      if (!meme) {
        return res.status(404).json({ message: "Meme not found" });
      }
      res.json(meme);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch meme",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Download meme by ID - redirects to Cloudinary URL
  app.get("/api/memes/:id/download", async (req, res) => {
    try {
      const meme = await storage.getMeme(req.params.id);
      if (!meme) {
        return res.status(404).json({ message: "Meme not found" });
      }
      
      // Redirect to the Cloudinary URL for direct download
      res.redirect(meme.imageUrl);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get meme for download",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Upload new meme
  app.post("/api/memes", upload.single("image"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const bodySchema = z.object({
        title: z.string().min(1, "Title is required").max(200, "Title too long"),
        tags: z.string().transform(str => 
          str.split(",")
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 10) // Limit to 10 tags
        ),
      });

      const { title, tags } = bodySchema.parse(req.body);
      
      const memeData = {
        title,
        tags,
        imageUrl: req.file.path, // Cloudinary URL
      };

      const validatedData = insertMemeSchema.parse(memeData);
      const meme = await storage.createMeme(validatedData);
      
      res.status(201).json(meme);
    } catch (error) {
      // Clean up uploaded file if validation fails
      if (req.file && 'public_id' in req.file) {
        cloudinary.uploader.destroy((req.file as any).public_id).catch(console.error);
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to upload meme",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Delete meme
  app.delete("/api/memes/:id", async (req, res) => {
    try {
      const meme = await storage.getMeme(req.params.id);
      if (!meme) {
        return res.status(404).json({ message: "Meme not found" });
      }

      console.log(`[Delete] Starting deletion for meme ID: ${req.params.id}, URL: ${meme.imageUrl}`);

      // Delete from Cloudinary first
      let cloudinaryDeleted = false;
      try {
        const publicId = extractCloudinaryPublicId(meme.imageUrl);
        if (publicId) {
          console.log(`[Cloudinary] Attempting to delete public_id: ${publicId}`);
          const result = await cloudinary.uploader.destroy(publicId);
          console.log(`[Cloudinary] Delete result:`, result);
          
          if (result.result === 'ok') {
            cloudinaryDeleted = true;
            console.log(`[Cloudinary] Successfully deleted public_id: ${publicId}`);
          } else if (result.result === 'not found') {
            // Image might already be deleted, but that's okay
            cloudinaryDeleted = true;
            console.log(`[Cloudinary] Image already deleted or not found: ${publicId}`);
          } else {
            console.warn(`[Cloudinary] Delete failed for public_id: ${publicId}, result:`, result);
          }
        } else {
          // If it's not a Cloudinary URL, consider it "deleted" since there's nothing to delete
          cloudinaryDeleted = true;
          console.log(`[Cloudinary] Not a Cloudinary URL, skipping deletion: ${meme.imageUrl}`);
        }
      } catch (e) {
        console.error("[Cloudinary] Failed to delete image:", e);
        // Don't fail the entire operation if Cloudinary deletion fails
        // The image might already be deleted or the URL might be malformed
      }

      // Delete from MongoDB
      const mongoDeleted = await storage.deleteMeme(req.params.id);
      if (!mongoDeleted) {
        console.error(`[MongoDB] Failed to delete meme with ID: ${req.params.id}`);
        return res.status(500).json({ message: "Failed to delete meme from database" });
      }
      
      console.log(`[MongoDB] Successfully deleted meme with ID: ${req.params.id}`);
      
      // Return success even if Cloudinary deletion failed, but log the issue
      if (!cloudinaryDeleted) {
        console.warn(`[Warning] Meme deleted from database but Cloudinary deletion failed for ID: ${req.params.id}`);
      }
      
      res.json({ 
        message: "Meme deleted successfully",
        cloudinaryDeleted,
        mongoDeleted: true
      });
    } catch (error) {
      console.error(`[Delete] Error deleting meme ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to delete meme",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Rename meme (update title and image)
  app.patch("/api/memes/:id/rename", upload.single("image"), async (req: MulterRequest, res) => {
    console.log("[PATCH] /api/memes/:id/rename called", {
      id: req.params.id,
      body: req.body,
      file: req.file,
      headers: req.headers,
      method: req.method,
      url: req.url
    });
    try {
      const meme = await storage.getMeme(req.params.id);
      if (!meme) {
        console.log("Meme not found for id", req.params.id);
        return res.status(404).json({ message: "Meme not found" });
      }

      const bodySchema = z.object({
        title: z.string().min(1, "Title is required").max(200, "Title too long"),
        tags: z.string().optional(),
      });
      const { title, tags } = bodySchema.parse(req.body);

      let newImageUrl = meme.imageUrl;
      // If a new image is uploaded, use its URL and delete the old one from Cloudinary
      if (req.file) {
        newImageUrl = req.file.path;
        try {
          const publicId = extractCloudinaryPublicId(meme.imageUrl);
          if (publicId) {
            console.log(`[Cloudinary] Deleting old image during rename: ${publicId}`);
            const result = await cloudinary.uploader.destroy(publicId);
            console.log(`[Cloudinary] Old image delete result:`, result);
          }
        } catch (e) {
          console.error("[Cloudinary] Failed to delete old image during rename:", e);
        }
      }

      // Parse tags string to array, fallback to old tags if not provided
      let tagsArr = meme.tags;
      if (typeof tags === "string") {
        tagsArr = tags
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
          .slice(0, 10);
      }

      const updated = await storage.renameMeme(req.params.id, title, newImageUrl, tagsArr);
      if (!updated) {
        console.log("Failed to update meme for id", req.params.id);
        return res.status(500).json({ message: "Failed to rename meme" });
      }
      console.log("Meme updated successfully", updated);
      res.json(updated);
    } catch (error) {
      console.error("Error in /api/memes/:id/rename", error);
      // Clean up uploaded file if validation fails
      if (req.file && 'public_id' in req.file) {
        cloudinary.uploader.destroy((req.file as any).public_id).catch(console.error);
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Failed to rename meme",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}