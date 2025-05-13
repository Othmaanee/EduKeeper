
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

type XpAction = 'summarize_document' | 'generate_control' | 'generate_exercises';

const XP_REWARDS = {
  summarize_document: 20,
  generate_control: 40,
  generate_exercises: 30
};

export function useXp() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const awardXp = async (action: XpAction, documentName: string = '') => {
    try {
      setIsProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const userId = session.user.id;
      const xpGained = XP_REWARDS[action];
      
      // 1. Obtenir les XP actuels de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      const oldLevel = userData.level;
      const newXp = userData.xp + xpGained;
      
      // 2. Mettre à jour les XP de l'utilisateur
      const { error: updateError } = await supabase
        .from('users')
        .update({ xp: newXp })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // 3. Récupérer le niveau après la mise à jour
      const { data: updatedUserData, error: fetchError } = await supabase
        .from('users')
        .select('level')
        .eq('id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newLevel = updatedUserData.level;
      
      // 4. Ajouter l'action à l'historique avec les XP gagnés
      const { error: historyError } = await supabase
        .from('history')
        .insert([{
          user_id: userId,
          action_type: action,
          document_name: documentName,
          xp_gained: xpGained
        }]);
      
      if (historyError) throw historyError;
      
      // 5. Afficher un message de félicitations s'il y a eu une montée de niveau
      if (newLevel > oldLevel) {
        toast({
          title: `🎉 Félicitations !`,
          description: `Tu as atteint le niveau ${newLevel} !`,
          duration: 5000,
        });
      } else {
        toast({
          title: `+${xpGained} XP`,
          description: `Tu as gagné ${xpGained} XP en utilisant cette fonctionnalité !`,
          duration: 3000,
        });
      }
      
      return { xpGained, levelUp: newLevel > oldLevel };
    } catch (error: any) {
      console.error('Erreur lors de l\'attribution des XP:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer des XP. Réessayez plus tard.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { awardXp, isProcessing };
}
