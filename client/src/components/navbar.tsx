import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Plus, Laugh } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export default function Navbar({ onSearch, searchValue = "" }: NavbarProps) {
  const [search, setSearch] = useState(searchValue);
  const [location] = useLocation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch?.(value);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Laugh className="text-primary-foreground text-lg" size={20} />
            </div>
            <h1 className="text-xl font-bold text-foreground">MemeHub</h1>
          </Link>

          {/* Search Bar */}
          {location === "/" && (
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search memes by title or tags..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-10 bg-input border-border text-foreground placeholder-muted-foreground focus:ring-ring"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Link href="/upload">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors duration-200 flex items-center space-x-2"
              data-testid="button-upload"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Upload Meme</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
