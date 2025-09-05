import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(search)}`);
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-card shadow-md">
      <Link to="/" className="text-2xl font-bold text-accent">MemeHub</Link>
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search memes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1 rounded bg-background text-text border border-secondary focus:outline-none"
        />
        <button type="submit" className="px-3 py-1 bg-accent text-white rounded hover:bg-secondary">Search</button>
      </form>
      <Link to="/upload" className="px-4 py-2 bg-secondary text-white rounded hover:bg-accent">Upload</Link>
    </nav>
  );
}

export default Navbar;
