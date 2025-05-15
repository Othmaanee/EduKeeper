
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  role?: string | string[];
  showOrder?: number;
  disabled?: boolean;
}

interface NavigationItemProps {
  item: NavItem;
  onMobileNavClick?: () => void;
}

export const NavigationItem = ({ item, onMobileNavClick }: NavigationItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  
  if (item.disabled) {
    return (
      <div 
        className={cn(
          "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed",
          "text-muted-foreground"
        )}
      >
        <item.icon className="h-5 w-5 mr-3" />
        <span>{item.label}</span>
        <span className="bg-muted text-xs rounded-full px-2 ml-auto">Bientôt</span>
      </div>
    );
  }
  
  return (
    <Link 
      to={item.path}
      className={cn(
        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
      onClick={onMobileNavClick}
    >
      <item.icon className="h-5 w-5 mr-3" />
      <span>{item.label}</span>
      {isActive && (
        <ChevronRight className="h-4 w-4 ml-auto" />
      )}
    </Link>
  );
};
