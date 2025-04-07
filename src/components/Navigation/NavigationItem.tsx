
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
}

interface NavigationItemProps {
  item: NavItem;
}

export const NavigationItem = ({ item }: NavigationItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  
  return (
    <Link 
      to={item.path}
      className={cn(
        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <item.icon className="h-5 w-5 mr-3" />
      <span>{item.label}</span>
      {isActive && (
        <ChevronRight className="h-4 w-4 ml-auto" />
      )}
    </Link>
  );
};
