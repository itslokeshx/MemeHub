import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Plus, Laugh, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export default function Navbar({ onSearch, searchValue = "" }: NavbarProps) {
  const [search, setSearch] = useState(searchValue);
  const [location] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
    // Listen for login/logout changes in other tabs
    const handler = () => setIsAdmin(localStorage.getItem("isAdmin") === "true");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onSearch?.(value);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between h-16 w-full gap-2">
          {/* MemeHub icon only, always visible */}
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity min-w-fit"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Laugh className="text-primary-foreground text-lg" size={24} />
            </div>
          </Link>

          {/* Search Bar - reduced width on mobile, larger on desktop */}
          {location === "/" && (
            <div className="flex-1 max-w-[180px] sm:max-w-2xl mx-0 sm:mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search memes by title or tags..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-10 bg-input border-border text-foreground placeholder-muted-foreground focus:ring-ring text-base sm:text-lg h-12 sm:h-14"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              </div>
            </div>
          )}

          {/* Upload and Admin Buttons - always in row */}
          <div className="flex flex-row items-center gap-2">
            <Link href="/upload">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors duration-200 flex items-center space-x-2 px-2 py-2 w-9 sm:w-auto"
                data-testid="button-upload"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Upload Meme</span>
              </Button>
            </Link>
            {isAdmin ? (
              <Button
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium transition-colors duration-200 flex items-center space-x-2 px-2 py-2 w-9 sm:px-4 sm:py-2 sm:w-auto"
                data-testid="button-admin-logout"
                onClick={() => {
                  localStorage.removeItem("isAdmin");
                  setIsAdmin(false);
                  window.location.reload();
                }}
              >
                <span className="sm:hidden"><Lock size={18} /></span>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : (
              <Link href="/admin-login">
                <Button
                  size="sm"
                  className="rounded-lg bg-primary/80 border border-white text-white font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-none hover:bg-primary px-2 py-2 w-9 sm:w-auto"
                  data-testid="button-admin-login"
                >
                  <span className="sm:hidden"><Lock size={18} /></span>
                  <span className="hidden sm:inline">Admin Login</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
