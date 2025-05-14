
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useToast } from '@/components/ui/use-toast';

// XP values for different actions
export const XP_VALUES = {
  document_upload: 15,
  generate_summary: 10,
  generate_exercises: 20,
  generate_control: 25,
  complete_exercise: 5,
  profile_complete: 10,
  daily_login: 3
};

// Define the XpActionType based on the keys of XP_VALUES
export type XpActionType = keyof typeof XP_VALUES;

export interface XpResult {
  success: boolean;
  message: string;
  currentXp?: number;
}

export const useXp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Award XP to a user for completing an action
   */
  const awardXP = async (userId: string, action: XpActionType): Promise<XpResult> => {
    if (!userId) {
      console.error("No user ID provided to awardXP");
      return { success: false, message: "Aucun utilisateur identifié" };
    }
    
    if (!XP_VALUES[action]) {
      console.error(`Invalid action type: ${action}`);
      return { success: false, message: "Action non reconnue" };
    }

    try {
      setIsLoading(true);
      
      // Fetch current user XP
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('xp')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      const currentXp = userData?.xp || 0;
      const xpToAdd = XP_VALUES[action];
      const newXp = currentXp + xpToAdd;
      
      // Update user XP using the update_user_xp RPC function
      const { error: updateError } = await supabase
        .rpc('update_user_xp', {
          user_id: userId,
          new_xp: newXp
        });
        
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      return { 
        success: true, 
        message: `+${xpToAdd} XP (${action})`, 
        currentXp: newXp 
      };
    } catch (error: any) {
      console.error("Error awarding XP:", error);
      toast({
        variant: "destructive",
        title: "Erreur XP",
        description: "Impossible de mettre à jour vos points d'expérience."
      });
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if a user has completed a specific action today
   */
  const hasCompletedActionToday = async (userId: string, actionType: string): Promise<boolean> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', actionType)
        .gte('created_at', today.toISOString());
      
      if (error) {
        throw error;
      }
      
      return count !== null && count > 0;
    } catch (error) {
      console.error("Error checking completed actions:", error);
      return false;
    }
  };

  return {
    awardXP,
    isLoading,
    hasCompletedActionToday,
  };
};
