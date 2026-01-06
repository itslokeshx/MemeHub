import { type Meme, type InsertMeme } from "@shared/schema";
import { randomUUID } from "crypto";
import mongoose from "mongoose";

export interface EditHistoryEntry {
  previousName: string;
  previousTags: string[];
  editedAt: Date;
}

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

export interface IStorage {
  // Meme operations
  getMeme(id: string): Promise<Meme | undefined>;
  getMemes(options?: { search?: string; limit?: number; offset?: number; sortBy?: 'recent' | 'popular' | 'featured' }): Promise<Meme[]>;
  createMeme(meme: InsertMeme): Promise<Meme>;
  createMemesBulk(memes: InsertMeme[]): Promise<Meme[]>;
  deleteMeme(id: string): Promise<boolean>;
  renameMeme(id: string, newTitle: string, newImageUrl: string, newTags?: string[]): Promise<Meme | undefined>;

  // User edit operations
  editMeme(id: string, newName: string, newTags: string[]): Promise<Meme | undefined>;

  // Admin moderation operations
  lockMeme(id: string, isLocked: boolean): Promise<boolean>;
  featureMeme(id: string, isFeatured: boolean): Promise<boolean>;
  getEditHistory(id: string): Promise<EditHistoryEntry[]>;

  // Admin operations
  createAdmin(username: string, passwordHash: string): Promise<Admin>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: string): Promise<Admin | undefined>;
}

// Mongoose Schema for Admin
const AdminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => randomUUID() },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const AdminModel = mongoose.model('Admin', AdminSchema);

// Mongoose Schema for Meme (Enhanced)
const MemeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => randomUUID() },
  title: { type: String, required: true },
  tags: { type: [String], required: true, default: [] },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  // Edit tracking
  editedByUsers: { type: Number, default: 0 },
  lastEditedAt: { type: Date, default: null },
  editHistory: [{
    previousName: String,
    previousTags: [String],
    editedAt: Date
  }],
  // Moderation
  isLocked: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false }
});

// Create indexes for efficient search
MemeSchema.index({ title: 'text', tags: 'text' });
MemeSchema.index({ createdAt: -1 });
MemeSchema.index({ editedByUsers: -1 });
MemeSchema.index({ isFeatured: -1 });

const MemeModel = mongoose.model('Meme', MemeSchema);

export class MongoStorage implements IStorage {
  async connect() {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');
      }
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async getMeme(id: string): Promise<Meme | undefined> {
    try {
      const meme = await MemeModel.findOne({ id }).lean();
      return meme ? {
        id: meme.id,
        title: meme.title,
        tags: meme.tags,
        imageUrl: meme.imageUrl,
        createdAt: meme.createdAt
      } : undefined;
    } catch (error) {
      console.error('Error getting meme:', error);
      return undefined;
    }
  }

  async getMemes(options: { search?: string; limit?: number; offset?: number; sortBy?: 'recent' | 'popular' | 'featured' } = {}): Promise<Meme[]> {
    const { search, limit = 10000, offset = 0, sortBy = 'recent' } = options;
    try {
      let query: any = {};
      // Add search filter if provided
      if (search) {
        query = {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        };
      }

      // Determine sort order
      let sort: any = { createdAt: -1 };
      if (sortBy === 'popular') {
        sort = { editedByUsers: -1, createdAt: -1 };
      } else if (sortBy === 'featured') {
        sort = { isFeatured: -1, createdAt: -1 };
      }

      const memes = await MemeModel
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean();
      return memes.map(meme => ({
        id: meme.id,
        title: meme.title,
        tags: meme.tags,
        imageUrl: meme.imageUrl,
        createdAt: meme.createdAt,
        editedByUsers: meme.editedByUsers || 0,
        lastEditedAt: meme.lastEditedAt || null,
        editHistory: meme.editHistory || [],
        isLocked: meme.isLocked || false,
        isFeatured: meme.isFeatured || false
      } as any));
    } catch (error) {
      console.error('Error getting memes:', error);
      return [];
    }
  }

  async createMeme(insertMeme: InsertMeme): Promise<Meme> {
    try {
      const id = randomUUID();
      const memeDoc = new MemeModel({
        id,
        title: insertMeme.title,
        tags: insertMeme.tags || [],
        imageUrl: insertMeme.imageUrl,
        createdAt: new Date()
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
      console.error('Error creating meme:', error);
      throw error;
    }
  }

  async createMemesBulk(memes: InsertMeme[]): Promise<Meme[]> {
    try {
      const memeDocs = memes.map(meme => ({
        id: randomUUID(),
        title: meme.title,
        tags: meme.tags || [],
        imageUrl: meme.imageUrl,
        createdAt: new Date(),
        editedByUsers: 0,
        lastEditedAt: null,
        editHistory: [],
        isLocked: false,
        isFeatured: false
      }));

      const savedMemes = await MemeModel.insertMany(memeDocs);

      return savedMemes.map(meme => ({
        id: meme.id,
        title: meme.title,
        tags: meme.tags,
        imageUrl: meme.imageUrl,
        createdAt: meme.createdAt,
        editedByUsers: meme.editedByUsers,
        lastEditedAt: meme.lastEditedAt,
        editHistory: meme.editHistory,
        isLocked: meme.isLocked,
        isFeatured: meme.isFeatured
      } as any));
    } catch (error) {
      console.error('Error creating memes in bulk:', error);
      throw error;
    }
  }

  async deleteMeme(id: string): Promise<boolean> {
    try {
      const result = await MemeModel.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting meme:', error);
      return false;
    }
  }

  async renameMeme(id: string, newTitle: string, newImageUrl: string, newTags?: string[]): Promise<Meme | undefined> {
    try {
      const updateFields: any = { title: newTitle, imageUrl: newImageUrl };
      if (newTags) updateFields.tags = newTags;
      const updated = await MemeModel.findOneAndUpdate(
        { id },
        { $set: updateFields },
        { new: true }
      ).lean();
      if (!updated) return undefined;
      return {
        id: updated.id,
        title: updated.title,
        tags: updated.tags,
        imageUrl: updated.imageUrl,
        createdAt: updated.createdAt,
        editedByUsers: updated.editedByUsers,
        lastEditedAt: updated.lastEditedAt,
        editHistory: updated.editHistory,
        isLocked: updated.isLocked,
        isFeatured: updated.isFeatured
      } as any;
    } catch (error) {
      console.error('Error renaming meme:', error);
      return undefined;
    }
  }

  // User edit operations
  async editMeme(id: string, newName: string, newTags: string[]): Promise<Meme | undefined> {
    try {
      const meme = await MemeModel.findOne({ id });
      if (!meme) return undefined;
      if (meme.isLocked) {
        throw new Error('Meme is locked and cannot be edited');
      }

      // Store edit history
      const historyEntry = {
        previousName: meme.title,
        previousTags: meme.tags,
        editedAt: new Date()
      };

      const updated = await MemeModel.findOneAndUpdate(
        { id },
        {
          $set: {
            title: newName,
            tags: newTags,
            lastEditedAt: new Date()
          },
          $inc: { editedByUsers: 1 },
          $push: { editHistory: historyEntry }
        },
        { new: true }
      ).lean();

      if (!updated) return undefined;
      return {
        id: updated.id,
        title: updated.title,
        tags: updated.tags,
        imageUrl: updated.imageUrl,
        createdAt: updated.createdAt,
        editedByUsers: updated.editedByUsers,
        lastEditedAt: updated.lastEditedAt,
        editHistory: updated.editHistory,
        isLocked: updated.isLocked,
        isFeatured: updated.isFeatured
      } as any;
    } catch (error) {
      console.error('Error editing meme:', error);
      throw error;
    }
  }

  // Admin moderation operations
  async lockMeme(id: string, isLocked: boolean): Promise<boolean> {
    try {
      const result = await MemeModel.updateOne({ id }, { $set: { isLocked } });
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error locking meme:', error);
      return false;
    }
  }

  async featureMeme(id: string, isFeatured: boolean): Promise<boolean> {
    try {
      const result = await MemeModel.updateOne({ id }, { $set: { isFeatured } });
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error featuring meme:', error);
      return false;
    }
  }

  async getEditHistory(id: string): Promise<EditHistoryEntry[]> {
    try {
      const meme = await MemeModel.findOne({ id }).lean();
      return (meme?.editHistory || []) as EditHistoryEntry[];
    } catch (error) {
      console.error('Error getting edit history:', error);
      return [];
    }
  }

  // Admin operations
  async createAdmin(username: string, passwordHash: string): Promise<Admin> {
    try {
      const id = randomUUID();
      const adminDoc = new AdminModel({
        id,
        username,
        passwordHash,
        role: 'admin',
        createdAt: new Date()
      });

      const savedAdmin = await adminDoc.save();

      return {
        id: savedAdmin.id,
        username: savedAdmin.username,
        passwordHash: savedAdmin.passwordHash,
        role: savedAdmin.role,
        createdAt: savedAdmin.createdAt
      };
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    try {
      const admin = await AdminModel.findOne({ username }).lean();
      return admin ? {
        id: admin.id,
        username: admin.username,
        passwordHash: admin.passwordHash,
        role: admin.role,
        createdAt: admin.createdAt
      } : undefined;
    } catch (error) {
      console.error('Error getting admin by username:', error);
      return undefined;
    }
  }

  async getAdminById(id: string): Promise<Admin | undefined> {
    try {
      const admin = await AdminModel.findOne({ id }).lean();
      return admin ? {
        id: admin.id,
        username: admin.username,
        passwordHash: admin.passwordHash,
        role: admin.role,
        createdAt: admin.createdAt
      } : undefined;
    } catch (error) {
      console.error('Error getting admin by id:', error);
      return undefined;
    }
  }
}

export class MemStorage implements IStorage {
  private memes: Map<string, Meme>;

  constructor() {
    this.memes = new Map();
  }

  async getMeme(id: string): Promise<Meme | undefined> {
    return this.memes.get(id);
  }

  async getMemes(options: { search?: string; limit?: number; offset?: number } = {}): Promise<Meme[]> {
    const { search, limit = 20, offset = 0 } = options;
    let memesArray = Array.from(this.memes.values());

    // Filter by search term in title or tags
    if (search) {
      const searchLower = search.toLowerCase();
      memesArray = memesArray.filter(meme =>
        meme.title.toLowerCase().includes(searchLower) ||
        meme.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by creation date (newest first)
    memesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    return memesArray.slice(offset, offset + limit);
  }

  async createMeme(insertMeme: InsertMeme): Promise<Meme> {
    const id = randomUUID();
    const meme: Meme = {
      ...insertMeme,
      tags: insertMeme.tags || [],
      id,
      createdAt: new Date()
    };
    this.memes.set(id, meme);
    return meme;
  }

  async deleteMeme(id: string): Promise<boolean> {
    return this.memes.delete(id);
  }

  async renameMeme(id: string, newTitle: string, newImageUrl: string, newTags?: string[]): Promise<Meme | undefined> {
    const meme = this.memes.get(id);
    if (!meme) return undefined;
    const updated: Meme = { ...meme, title: newTitle, imageUrl: newImageUrl, tags: newTags ?? meme.tags };
    this.memes.set(id, updated);
    return updated;
  }

  async createMemesBulk(memes: InsertMeme[]): Promise<Meme[]> {
    return Promise.all(memes.map(meme => this.createMeme(meme)));
  }

  async editMeme(id: string, newName: string, newTags: string[]): Promise<Meme | undefined> {
    const meme = this.memes.get(id);
    if (!meme) return undefined;
    const updated: Meme = { ...meme, title: newName, tags: newTags };
    this.memes.set(id, updated);
    return updated;
  }

  async lockMeme(id: string, isLocked: boolean): Promise<boolean> {
    const meme = this.memes.get(id);
    if (!meme) return false;
    this.memes.set(id, { ...meme, isLocked } as any);
    return true;
  }

  async featureMeme(id: string, isFeatured: boolean): Promise<boolean> {
    const meme = this.memes.get(id);
    if (!meme) return false;
    this.memes.set(id, { ...meme, isFeatured } as any);
    return true;
  }

  async getEditHistory(id: string): Promise<EditHistoryEntry[]> {
    return [];
  }

  async createAdmin(username: string, passwordHash: string): Promise<Admin> {
    throw new Error('Admin operations not supported in memory storage');
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return undefined;
  }

  async getAdminById(id: string): Promise<Admin | undefined> {
    return undefined;
  }
}

// Use MongoDB storage if MONGODB_URI is available, otherwise fall back to memory storage
const mongoStorage = new MongoStorage();
const memStorage = new MemStorage();

export const storage = process.env.MONGODB_URI ? mongoStorage : memStorage;