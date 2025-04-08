
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
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
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
            className="md:hidden bg-primary/10 text-primary"
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
