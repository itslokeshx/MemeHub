const mongoose = require('mongoose');

const MemeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tags: [{ type: String }],
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

MemeSchema.index({ title: 'text', tags: 'text' });

module.exports = mongoose.model('Meme', MemeSchema);
