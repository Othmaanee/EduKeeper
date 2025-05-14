
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserLevel } from '@/components/UserLevel';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, LogOut, User, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileProps {
  user: any;
  onLogout: () => void;
  loggingOut: boolean;
}

export const UserProfile = ({ user, onLogout, loggingOut }: UserProfileProps) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des infos utilisateur:", error);
      }
    };
    
    fetchUserDetails();
  }, [user]);
  
  return (
    <div className="mt-auto border-t pt-4 px-4 pb-6">
      {userProfile ? (
        <>
          <UserLevel className="mb-4" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
              >
                <User className="h-4 w-4" />
                <span className="truncate">
                  {userProfile.prenom ? `${userProfile.prenom}` : user?.email}
                </span>
                <ChevronDown className="h-3 w-3 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon profil</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/skins">
                  <Palette className="h-4 w-4 mr-2" />
                  Mes Skins
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500" 
                disabled={loggingOut}
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {loggingOut ? "Déconnexion..." : "Déconnexion"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-secondary rounded-md w-3/4" />
          <div className="h-10 bg-secondary rounded-md" />
        </div>
      )}
    </div>
  );
};
