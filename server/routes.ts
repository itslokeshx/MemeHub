import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemeSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

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

      // Extract public_id from Cloudinary URL and delete from Cloudinary
      if (meme.imageUrl.includes("cloudinary.com")) {
        // Cloudinary URLs look like: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/memes/<public_id>.<ext>
        // We want to extract the path after '/upload/' and before the extension
        try {
          const urlParts = meme.imageUrl.split("/upload/");
          if (urlParts.length === 2) {
            let publicIdWithExt = urlParts[1]; // e.g. memes/abc123.jpg
            // Remove extension
            const dotIdx = publicIdWithExt.lastIndexOf(".");
            if (dotIdx !== -1) publicIdWithExt = publicIdWithExt.substring(0, dotIdx);
            await cloudinary.uploader.destroy(publicIdWithExt);
          }
        } catch (e) {
          console.error("Failed to parse and delete Cloudinary image:", e);
        }
      }

      const deleted = await storage.deleteMeme(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Meme not found" });
      }
      
      res.json({ message: "Meme deleted successfully" });
    } catch (error) {
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
        if (meme.imageUrl.includes("cloudinary.com")) {
          const publicId = meme.imageUrl.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`memes/${publicId}`);
          }
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