
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserProfile } from './UserProfile';
import { NavigationItem, NavItem } from './NavigationItem';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  user: any;
  onLogout: () => void;
  loggingOut: boolean;
}

export const Sidebar = ({ 
  isOpen, 
  onClose, 
  navItems, 
  user, 
  onLogout, 
  loggingOut 
}: SidebarProps) => {
  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-subtle border-r border-border transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="px-6 py-8 flex items-center">
          <img 
            src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
            alt="EduKeeper Logo" 
            className="h-8 w-8 mr-2" 
          />
          <h1 className="text-xl font-semibold tracking-tight">EduKeeper</h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <Separator />
        
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => (
            <NavigationItem key={item.path} item={item} />
          ))}
        </nav>
        
        <UserProfile 
          user={user} 
          onLogout={onLogout} 
          loggingOut={loggingOut} 
        />
      </div>
    </aside>
  );
};
