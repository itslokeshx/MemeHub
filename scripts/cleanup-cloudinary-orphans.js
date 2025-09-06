// Script to delete orphaned images from Cloudinary that are not in MongoDB
// Usage: node cleanup-cloudinary-orphans.js

require('dotenv').config();
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to MongoDB
const MemeSchema = new mongoose.Schema({
  imageUrl: String,
});
const Meme = mongoose.model('Meme', MemeSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const memes = await Meme.find({}, 'imageUrl').lean();
  const usedPublicIds = new Set(
    memes
      .map(m => {
        if (!m.imageUrl) return null;
        const parts = m.imageUrl.split('/upload/');
        if (parts.length !== 2) return null;
        let publicIdWithExt = parts[1];
        const dotIdx = publicIdWithExt.lastIndexOf('.');
        if (dotIdx !== -1) publicIdWithExt = publicIdWithExt.substring(0, dotIdx);
        return publicIdWithExt;
      })
      .filter(Boolean)
  );

  // List all images in the 'memes' folder in Cloudinary
  let nextCursor = undefined;
  let allCloudinaryIds = [];
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'memes/',
      max_results: 500,
      next_cursor: nextCursor,
    });
    allCloudinaryIds.push(...result.resources.map(r => r.public_id));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  // Find orphaned images
  const orphans = allCloudinaryIds.filter(id => !usedPublicIds.has(id));
  console.log(`Found ${orphans.length} orphaned images.`);

  // Delete orphans
  for (const id of orphans) {
    try {
      await cloudinary.uploader.destroy(id);
      console.log(`Deleted: ${id}`);
    } catch (e) {
      console.error(`Failed to delete ${id}:`, e.message);
    }
  }
  console.log('Cleanup complete.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
