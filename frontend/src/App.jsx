import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MemeGrid from './components/MemeGrid';
import UploadForm from './components/UploadForm';
import MemeView from './components/MemeView';

function App() {
  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <Routes>
        <Route path="/" element={<MemeGrid />} />
        <Route path="/upload" element={<UploadForm />} />
        <Route path="/meme/:id" element={<MemeView />} />
      </Routes>
    </div>
  );
}

export default App;
