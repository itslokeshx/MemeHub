import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import MemeGrid from "@/components/meme-grid";

export default function Home() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Extract search query from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search") || "";
    setSearchQuery(search);
  }, [location]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Update URL with search parameter
    const url = new URL(window.location.href);
    if (query) {
      url.searchParams.set("search", query);
    } else {
      url.searchParams.delete("search");
    }
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} searchValue={searchQuery} />
      
      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8" data-testid="hero-section">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            The Ultimate Meme Hub
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload, discover, and download the funniest memes from around the web. Join the community and share the laughs!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/upload'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              data-testid="button-start-uploading"
            >
              Start Uploading
            </button>
            <button 
              onClick={() => document.querySelector('[data-testid="meme-grid"]')?.scrollIntoView({ behavior: 'smooth' })}
              className="border border-border hover:bg-card text-foreground px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              data-testid="button-browse-memes"
            >
              Browse Memes
            </button>
          </div>
        </div>
      </section>

      {/* Meme Grid */}
      <MemeGrid searchQuery={searchQuery} />
    </div>
  );
}
