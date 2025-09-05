import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/memes';

function MemeView() {
  const { id } = useParams();
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/${id}`)
      .then(res => {
        setMeme(res.data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (!meme) return <div className="text-center mt-8">Meme not found</div>;

  return (
    <div className="max-w-xl mx-auto mt-8 bg-card p-6 rounded shadow">
      <img src={meme.imageUrl} alt={meme.title} className="w-full h-80 object-contain mb-4 rounded" />
      <h2 className="text-2xl font-bold text-accent mb-2">{meme.title}</h2>
      <div className="mb-2 flex flex-wrap gap-1">
        {meme.tags.map((tag, i) => (
          <span key={i} className="bg-secondary text-xs px-2 py-0.5 rounded text-white">{tag}</span>
        ))}
      </div>
      <a
        href={meme.imageUrl}
        download
        className="px-4 py-2 bg-accent text-white rounded hover:bg-secondary inline-block mt-2"
      >Download</a>
      <Link to="/" className="block mt-4 text-secondary hover:underline">Back to Home</Link>
    </div>
  );
}

export default MemeView;
