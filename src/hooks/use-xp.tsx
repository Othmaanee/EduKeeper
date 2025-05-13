
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Définir les actions valides pour respecter la contrainte history_action_type_check
export type XpAction = 'summarize_document' | 'generate_control' | 'generate_exercises';

// Mapping des récompenses XP en fonction des actions
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
      
      // Vérifier que l'action est valide
      if (!Object.keys(XP_REWARDS).includes(action)) {
        throw new Error(`Action non valide: ${action}. Actions autorisées: ${Object.keys(XP_REWARDS).join(', ')}`);
      }
      
      // Vérifier la session utilisateur
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Erreur de session:', sessionError);
        throw new Error('Session utilisateur non disponible');
      }
      
      if (!session) {
        console.error('Aucune session utilisateur active');
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour gagner des XP.",
          variant: "destructive",
        });
        return null;
      }
      
      const userId = session.user.id;
      const xpGained = XP_REWARDS[action];
      
      console.log(`Attribution de ${xpGained} XP pour l'action ${action} à l'utilisateur ${userId}`);
      
      // 1. Obtenir les XP actuels de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Erreur lors de la récupération des données utilisateur:', userError);
        throw userError;
      }
      
      const oldLevel = userData.level;
      const newXp = userData.xp + xpGained;
      
      console.log(`XP précédents: ${userData.xp}, Nouveau total: ${newXp}`);
      
      // 2. Mettre à jour les XP de l'utilisateur
      const { error: updateError } = await supabase
        .from('users')
        .update({ xp: newXp })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Erreur lors de la mise à jour des XP:', updateError);
        throw updateError;
      }
      
      // 3. Récupérer le niveau après la mise à jour (le trigger SQL s'occupera de mettre à jour le niveau)
      const { data: updatedUserData, error: fetchError } = await supabase
        .from('users')
        .select('level, skin')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        console.error('Erreur lors de la récupération des données mises à jour:', fetchError);
        throw fetchError;
      }
      
      const newLevel = updatedUserData.level;
      
      // 4. Ajouter l'action à l'historique avec les XP gagnés
      // Vérifier que action est bien une valeur valide pour l'historique
      const { error: historyError } = await supabase
        .from('history')
        .insert([{
          user_id: userId,
          action_type: action,
          document_name: documentName,
          xp_gained: xpGained
        }]);
      
      if (historyError) {
        console.error('Erreur lors de l\'ajout à l\'historique:', historyError);
        console.error('Détail:', historyError.details || historyError.message);
        // Ne pas bloquer le flux pour une erreur d'historique
        console.warn('L\'historique n\'a pas pu être mis à jour, mais les XP ont été attribués');
      }
      
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
      
      return { xpGained, levelUp: newLevel > oldLevel, newSkin: updatedUserData.skin };
    } catch (error: any) {
      console.error('Erreur détaillée lors de l\'attribution des XP:', error);
      
      // Gestion plus précise des erreurs
      let message = "Impossible d'attribuer des XP. Réessayez plus tard.";
      
      if (error.message && error.message.includes("check constraint")) {
        message = "Erreur de contrainte: valeur d'action non valide. Actions autorisées: " + 
                  Object.keys(XP_REWARDS).join(', ');
      } else if (error.message && error.message.includes("duplicate key")) {
        message = "XP déjà attribués pour cette action.";
      } else if (error.message && error.message.includes("foreign key")) {
        message = "Erreur de référence utilisateur.";
      }
      
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { awardXp, isProcessing };
}
