const Meme = require('../models/Meme');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

exports.uploadMeme = async (req, res) => {
  try {
    const { title, tags } = req.body;
    console.log('Upload request body:', req.body);
    console.log('Upload request file:', req.file);
    if (!req.file) {
      console.error('No file received in upload');
      return res.status(400).json({ error: 'Image is required' });
    }
    const tagsArr = tags ? tags.split(',').map(t => t.trim()) : [];
    const imageUrl = req.file.path;
    console.log('Image URL from Cloudinary:', imageUrl);
    const meme = new Meme({ title, tags: tagsArr, imageUrl });
    await meme.save();
    console.log('Meme saved to MongoDB:', meme);
    res.status(201).json(meme);
  } catch (err) {
    console.error('Upload error:', err);
    if (err.response) {
      console.error('Cloudinary error response:', err.response.data);
    }
    res.status(500).json({ error: err.message, details: err });
  }
};

exports.getMemes = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 12 } = req.query;
    const query = search
      ? { $or: [
          { title: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ] }
      : {};
    const memes = await Meme.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Meme.countDocuments(query);
    res.json({ memes, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMemeById = async (req, res) => {
  try {
    const meme = await Meme.findById(req.params.id);
    if (!meme) return res.status(404).json({ error: 'Meme not found' });
    res.json(meme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
