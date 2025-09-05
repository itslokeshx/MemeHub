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
      
      

      {/* Meme Grid */}
      <MemeGrid searchQuery={searchQuery} />
    </div>
  );
}
