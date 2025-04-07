
import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface UserProfileProps {
  user: any;
  onLogout: () => void;
  loggingOut: boolean;
}

export const UserProfile = ({ user, onLogout, loggingOut }: UserProfileProps) => {
  return (
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
          onClick={onLogout}
          disabled={loggingOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
