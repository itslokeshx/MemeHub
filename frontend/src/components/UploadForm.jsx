import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/memes';

function UploadForm() {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !image) {
      setError('Title and image are required');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('tags', tags);
    formData.append('image', image);
    try {
      await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-card p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-accent">Upload Meme</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="px-3 py-2 rounded bg-background text-text border border-secondary"
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="px-3 py-2 rounded bg-background text-text border border-secondary"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0])}
          className="px-3 py-2 rounded bg-background text-text border border-secondary"
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="px-4 py-2 bg-accent text-white rounded hover:bg-secondary"
          disabled={loading}
        >{loading ? 'Uploading...' : 'Upload'}</button>
      </form>
    </div>
  );
}

export default UploadForm;
