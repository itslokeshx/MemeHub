import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemeSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  adminMiddleware,
  type AuthRequest
} from "./auth";

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
interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
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
  // ============================================
  // ADMIN AUTHENTICATION ROUTES
  // ============================================

  // Admin registration (one-time setup or for creating new admins)
  app.post("/api/admin/register", async (req, res) => {
    try {
      const registerSchema = z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      });

      const { username, password } = registerSchema.parse(req.body);

      // Check if admin already exists
      const existingAdmin = await storage.getAdminByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists" });
      }

      // Hash password and create admin
      const passwordHash = await hashPassword(password);
      const admin = await storage.createAdmin(username, passwordHash);

      // Generate JWT token
      const token = generateToken({
        userId: admin.id,
        username: admin.username,
        role: admin.role,
      });

      res.status(201).json({
        message: "Admin created successfully",
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }
      res.status(500).json({
        message: "Failed to create admin",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      console.log("[LOGIN] Request body:", req.body);

      const loginSchema = z.object({
        username: z.string(),
        password: z.string(),
      });

      const { username, password } = loginSchema.parse(req.body);
      console.log("[LOGIN] Parsed credentials - username:", username, "password length:", password?.length);

      // Find admin
      const admin = await storage.getAdminByUsername(username);
      console.log("[LOGIN] Admin found:", admin ? "YES" : "NO");

      if (!admin) {
        console.log("[LOGIN] Admin not found for username:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      console.log("[LOGIN] Comparing password...");
      const isValid = await comparePassword(password, admin.passwordHash);
      console.log("[LOGIN] Password valid:", isValid);

      if (!isValid) {
        console.log("[LOGIN] Password mismatch for user:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken({
        userId: admin.id,
        username: admin.username,
        role: admin.role,
      });

      console.log("[LOGIN] Login successful for:", username);
      res.json({
        message: "Login successful",
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }
      res.status(500).json({
        message: "Login failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============================================
  // PUBLIC MEME ROUTES
  // ============================================

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

  // ============================================
  // ADMIN BULK UPLOAD ROUTE
  // ============================================

  // Bulk upload memes (admin only)
  app.post("/api/admin/bulk-upload", authMiddleware, adminMiddleware, upload.array("images", 50), async (req: MulterRequest, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No image files provided" });
      }

      // Create memes with default metadata
      const memesToCreate = req.files.map(file => ({
        title: "memename",
        tags: ["memetag"],
        imageUrl: file.path, // Cloudinary URL
      }));

      const memes = await storage.createMemesBulk(memesToCreate);

      res.status(201).json({
        message: `Successfully uploaded ${memes.length} memes`,
        count: memes.length,
        memes,
      });
    } catch (error) {
      // Clean up uploaded files if creation fails
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          if ('public_id' in file) {
            cloudinary.uploader.destroy((file as any).public_id).catch(console.error);
          }
        }
      }

      res.status(500).json({
        message: "Failed to bulk upload memes",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================
  // USER CONTRIBUTION ROUTES
  // ============================================

  // User edit meme (name and tags only)
  app.put("/api/memes/:id/edit", async (req, res) => {
    try {
      const editSchema = z.object({
        name: z.string().min(1, "Name is required").max(200, "Name too long"),
        tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
      });

      const { name, tags } = editSchema.parse(req.body);

      const meme = await storage.getMeme(req.params.id);
      if (!meme) {
        return res.status(404).json({ message: "Meme not found" });
      }

      const updated = await storage.editMeme(req.params.id, name, tags);
      if (!updated) {
        return res.status(500).json({ message: "Failed to edit meme" });
      }

      res.json({
        message: "Meme updated successfully",
        meme: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors
        });
      }
      if (error instanceof Error && error.message.includes("locked")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({
        message: "Failed to edit meme",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================
  // ADMIN MODERATION ROUTES
  // ============================================

  // Lock/unlock meme (admin only)
  app.patch("/api/admin/memes/:id/lock", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const lockSchema = z.object({
        isLocked: z.boolean(),
      });

      const { isLocked } = lockSchema.parse(req.body);

      const success = await storage.lockMeme(req.params.id, isLocked);
      if (!success) {
        return res.status(404).json({ message: "Meme not found" });
      }

      res.json({
        message: `Meme ${isLocked ? 'locked' : 'unlocked'} successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({
        message: "Failed to lock/unlock meme",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Feature/unfeature meme (admin only)
  app.patch("/api/admin/memes/:id/feature", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const featureSchema = z.object({
        isFeatured: z.boolean(),
      });

      const { isFeatured } = featureSchema.parse(req.body);

      const success = await storage.featureMeme(req.params.id, isFeatured);
      if (!success) {
        return res.status(404).json({ message: "Meme not found" });
      }

      res.json({
        message: `Meme ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({
        message: "Failed to feature/unfeature meme",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get edit history (admin only)
  app.get("/api/admin/memes/:id/history", authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const history = await storage.getEditHistory(req.params.id);
      res.json({
        memeId: req.params.id,
        editHistory: history,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to get edit history",
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