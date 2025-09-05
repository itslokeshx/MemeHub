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
        limit: z.string().transform(val => parseInt(val) || 20).optional(),
        offset: z.string().transform(val => parseInt(val) || 0).optional(),
      });

      const { search, limit, offset } = searchSchema.parse(req.query);
      const memes = await storage.getMemes({ search, limit, offset });
      
      res.json(memes);
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
        const publicId = meme.imageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`memes/${publicId}`);
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

  const httpServer = createServer(app);
  return httpServer;
}