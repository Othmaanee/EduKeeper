
import React from 'react';
import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

type HeaderProps = {
  onToggleSidebar: () => void;
};

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-sm transition-all">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
        
        <div className={cn(
          "w-full flex gap-4 items-center justify-end"
        )}>
          <div className="w-full max-w-lg lg:max-w-xl">
            <SearchBar />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
