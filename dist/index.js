// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
import mongoose from "mongoose";
var MemeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => randomUUID() },
  title: { type: String, required: true },
  tags: { type: [String], required: true, default: [] },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
MemeSchema.index({ title: "text", tags: "text" });
MemeSchema.index({ createdAt: -1 });
var MemeModel = mongoose.model("Meme", MemeSchema);
var MongoStorage = class {
  async connect() {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");
      }
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
  async getMeme(id) {
    try {
      const meme = await MemeModel.findOne({ id }).lean();
      return meme ? {
        id: meme.id,
        title: meme.title,
        tags: meme.tags,
        imageUrl: meme.imageUrl,
        createdAt: meme.createdAt
      } : void 0;
    } catch (error) {
      console.error("Error getting meme:", error);
      return void 0;
    }
  }
  async getMemes(options = {}) {
    const { search, limit = 20, offset = 0 } = options;
    try {
      let query = {};
      if (search) {
        query = {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { tags: { $in: [new RegExp(search, "i")] } }
          ]
        };
      }
      const memes2 = await MemeModel.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
      return memes2.map((meme) => ({
        id: meme.id,
        title: meme.title,
        tags: meme.tags,
        imageUrl: meme.imageUrl,
        createdAt: meme.createdAt
      }));
    } catch (error) {
      console.error("Error getting memes:", error);
      return [];
    }
  }
  async createMeme(insertMeme) {
    try {
      const id = randomUUID();
      const memeDoc = new MemeModel({
        id,
        title: insertMeme.title,
        tags: insertMeme.tags || [],
        imageUrl: insertMeme.imageUrl,
        createdAt: /* @__PURE__ */ new Date()
      });
      const savedMeme = await memeDoc.save();
      return {
        id: savedMeme.id,
        title: savedMeme.title,
        tags: savedMeme.tags,
        imageUrl: savedMeme.imageUrl,
        createdAt: savedMeme.createdAt
      };
    } catch (error) {
      console.error("Error creating meme:", error);
      throw error;
    }
  }
  async deleteMeme(id) {
    try {
      const result = await MemeModel.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting meme:", error);
      return false;
    }
  }
};
var MemStorage = class {
  memes;
  constructor() {
    this.memes = /* @__PURE__ */ new Map();
  }
  async getMeme(id) {
    return this.memes.get(id);
  }
  async getMemes(options = {}) {
    const { search, limit = 20, offset = 0 } = options;
    let memesArray = Array.from(this.memes.values());
    if (search) {
      const searchLower = search.toLowerCase();
      memesArray = memesArray.filter(
        (meme) => meme.title.toLowerCase().includes(searchLower) || meme.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }
    memesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return memesArray.slice(offset, offset + limit);
  }
  async createMeme(insertMeme) {
    const id = randomUUID();
    const meme = {
      ...insertMeme,
      tags: insertMeme.tags || [],
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.memes.set(id, meme);
    return meme;
  }
  async deleteMeme(id) {
    return this.memes.delete(id);
  }
};
var mongoStorage = new MongoStorage();
var memStorage = new MemStorage();
var storage = process.env.MONGODB_URI ? mongoStorage : memStorage;

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var memes = pgTable("memes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertMemeSchema = createInsertSchema(memes).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
import { z } from "zod";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
var cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "memes",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"]
  }
});
var upload = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
async function registerRoutes(app2) {
  app2.get("/api/memes", async (req, res) => {
    try {
      const searchSchema = z.object({
        search: z.string().optional(),
        limit: z.string().transform((val) => parseInt(val) || 20).optional(),
        offset: z.string().transform((val) => parseInt(val) || 0).optional()
      });
      const { search, limit, offset } = searchSchema.parse(req.query);
      const memes2 = await storage.getMemes({ search, limit, offset });
      res.json(memes2);
    } catch (error) {
      res.status(400).json({
        message: "Failed to fetch memes",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/memes/:id", async (req, res) => {
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
  app2.post("/api/memes", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const bodySchema = z.object({
        title: z.string().min(1, "Title is required").max(200, "Title too long"),
        tags: z.string().transform(
          (str) => str.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0).slice(0, 10)
          // Limit to 10 tags
        )
      });
      const { title, tags } = bodySchema.parse(req.body);
      const memeData = {
        title,
        tags,
        imageUrl: req.file.path
        // Cloudinary URL
      };
      const validatedData = insertMemeSchema.parse(memeData);
      const meme = await storage.createMeme(validatedData);
      res.status(201).json(meme);
    } catch (error) {
      if (req.file && "public_id" in req.file) {
        cloudinary.uploader.destroy(req.file.public_id).catch(console.error);
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
  app2.delete("/api/memes/:id", async (req, res) => {
    try {
      const meme = await storage.getMeme(req.params.id);
      if (!meme) {
        return res.status(404).json({ message: "Meme not found" });
      }
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  if (process.env.MONGODB_URI && "connect" in storage) {
    try {
      await storage.connect();
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
