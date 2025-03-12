
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Home,
  FolderOpenIcon,
  Upload,
  LogOut,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/providers/AuthProvider';

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const navItems = [
  { label: 'Accueil', icon: Home, path: '/' },
  { label: 'Documents', icon: BookOpen, path: '/documents' },
  { label: 'Catégories', icon: FolderOpenIcon, path: '/categories' },
  { label: 'Importer', icon: Upload, path: '/upload' }
];

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const location = useLocation();
  const { user, handleLogout } = useAuth();

  return (
    <>
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-subtle border-r border-border transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-8 flex items-center">
            <BookOpen className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-xl font-semibold tracking-tight">EduKeeper</h1>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <Separator />
          
          {/* Nav Links */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === item.path 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
                {location.pathname === item.path && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </Link>
            ))}
          </nav>
          
          {/* User Section */}
          <div className="p-4 mt-auto">
            <Separator className="mb-4" />
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {user?.email ? user.email.split('@')[0] : 'Utilisateur'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'utilisateur@exemple.com'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
