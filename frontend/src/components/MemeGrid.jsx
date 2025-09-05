import React, { useEffect, useState } from 'react';
import MemeCard from './MemeCard';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/memes';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function MemeGrid() {
  const [memes, setMemes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const query = useQuery();
  const search = query.get('search') || '';
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}?search=${search}&page=${page}&limit=${limit}`)
      .then(res => {
        setMemes(res.data.memes);
        setTotal(res.data.total);
        setLoading(false);
      });
  }, [search, page]);

  return (
    <div className="p-4">
      {loading ? <div className="text-center">Loading...</div> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {memes.map(meme => <MemeCard key={meme._id} meme={meme} />)}
          </div>
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-card border border-secondary text-text rounded disabled:opacity-50"
            >Prev</button>
            <span className="px-2">Page {page}</span>
            <button
              onClick={() => setPage(p => (p * limit < total ? p + 1 : p))}
              disabled={page * limit >= total}
              className="px-3 py-1 bg-card border border-secondary text-text rounded disabled:opacity-50"
            >Next</button>
          </div>
        </>
      )}
    </div>
  );
}

export default MemeGrid;
