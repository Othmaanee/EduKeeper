
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

// Define the mapping of action types to XP values
export const XP_VALUES = {
  'generate_summary': 15,
  'generate_control': 15,
  'generate_exercises': 15,
  'document_upload': 10,
  'document_view': 3,
  'document_share': 5,
  'create_category': 5
} as const;

// Define the XpActionType from the keys of XP_VALUES
export type XpActionType = keyof typeof XP_VALUES;

export const useXP = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Function to check if an action has an XP value
  const isValidAction = (action: string): action is XpActionType => {
    return action in XP_VALUES;
  };

  // Fetch user XP and level from Supabase
  const fetchUserXP = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { xp: 0, level: 1 };
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      const safeXp = data?.xp || 0;
      const safeLevel = data?.level || 1;
      
      // Debug logs
      console.info('XP Store: données récupérées depuis Supabase:', { xp: safeXp, level: safeLevel });
      console.info('XP Store: valeurs sécurisées:', { safeXp, safeLevel });
      
      return { xp: safeXp, level: safeLevel };
    } catch (error) {
      console.error('Erreur lors de la récupération des XP:', error);
      return { xp: 0, level: 1 };
    }
  }, []);

  // Award XP for an action
  const awardXP = useCallback(async (actionType: XpActionType, documentName: string) => {
    try {
      setLoading(true);
      
      if (!isValidAction(actionType)) {
        console.error(`Type d'action non reconnu: ${actionType}`);
        return false;
      }
      
      const xpValue = XP_VALUES[actionType];
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }
      
      // Create history record
      const { error: historyError } = await supabase
        .from('history')
        .insert({
          user_id: session.user.id,
          action_type: actionType,
          document_name: documentName,
          xp_gained: xpValue
        });
      
      if (historyError) {
        throw historyError;
      }
      
      // Update user XP
      const { data, error } = await supabase
        .from('users')
        .update({ 
          xp: supabase.rpc('increment', { amount: xpValue }) 
        })
        .eq('id', session.user.id)
        .select('xp, level')
        .single();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: `+${xpValue} XP`,
        description: `Vous avez gagné de l'expérience !`,
        duration: 3000,
      });
      
      return { xp: data.xp, level: data.level };
    } catch (error) {
      console.error('Erreur lors de l\'attribution des XP:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    awardXP,
    fetchUserXP,
    loading
  };
};
