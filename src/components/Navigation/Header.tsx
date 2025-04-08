
import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '../SearchBar';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="px-6 sm:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          <SearchBar />
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
            <Link to="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            asChild
          >
            <Link to="/upload">
              <Upload className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
