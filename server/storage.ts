import { type Meme, type InsertMeme } from "@shared/schema";
import { randomUUID } from "crypto";
import mongoose from "mongoose";

export interface IStorage {
  getMeme(id: string): Promise<Meme | undefined>;
  getMemes(options?: { search?: string; limit?: number; offset?: number }): Promise<Meme[]>;
  createMeme(meme: InsertMeme): Promise<Meme>;
  deleteMeme(id: string): Promise<boolean>;
}

// Mongoose Schema for Meme
const MemeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => randomUUID() },
  title: { type: String, required: true },
  tags: { type: [String], required: true, default: [] },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create indexes for efficient search
MemeSchema.index({ title: 'text', tags: 'text' });
MemeSchema.index({ createdAt: -1 });

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

  async getMemes(options: { search?: string; limit?: number; offset?: number } = {}): Promise<Meme[]> {
    const { search, limit = 20, offset = 0 } = options;
    
    try {
      let query = {};
      
      // Add search filter if provided
      if (search) {
        query = {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        };
      }

      const memes = await MemeModel
        .find(query)
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(offset)
        .limit(limit)
        .lean();

      return memes.map(meme => ({
        id: meme.id,
        title: meme.title,
        tags: meme.tags,
        imageUrl: meme.imageUrl,
        createdAt: meme.createdAt
      }));
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

  async deleteMeme(id: string): Promise<boolean> {
    try {
      const result = await MemeModel.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting meme:', error);
      return false;
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
}

// Use MongoDB storage if MONGODB_URI is available, otherwise fall back to memory storage
const mongoStorage = new MongoStorage();
const memStorage = new MemStorage();

export const storage = process.env.MONGODB_URI ? mongoStorage : memStorage;
