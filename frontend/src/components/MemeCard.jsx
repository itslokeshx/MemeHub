import React from 'react';

function MemeCard({ meme }) {
  return (
    <div className="bg-card rounded shadow hover:shadow-lg transition overflow-hidden flex flex-col">
      <img src={meme.imageUrl} alt={meme.title} className="w-full h-48 object-cover" />
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-1 text-accent">{meme.title}</h3>
        <div className="mb-2 flex flex-wrap gap-1">
          {meme.tags.map((tag, i) => (
            <span key={i} className="bg-secondary text-xs px-2 py-0.5 rounded text-white">{tag}</span>
          ))}
        </div>
        <a
          href={meme.imageUrl}
          download
          className="mt-auto px-3 py-1 bg-accent text-white rounded hover:bg-secondary text-center"
        >Download</a>
      </div>
    </div>
  );
}

export default MemeCard;
