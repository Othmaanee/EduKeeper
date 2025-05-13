
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Définition des actions valides pour l'historique
export const VALID_ACTION_TYPES = [
  'summarize_document',
  'generate_control',
  'generate_exercises',
  'login',
  'upload_document'
];

// Mapping des XP par type d'action
export const XP_VALUES = {
  'summarize_document': 20,
  'generate_control': 40,
  'generate_exercises': 30,
  'login': 5,
  'upload_document': 10
};

export function useXp() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Attribue des points d'expérience à l'utilisateur et enregistre l'action dans l'historique
   * @param actionType Le type d'action (doit correspondre aux contraintes de la table history)
   * @param documentName Nom du document pour l'historique
   */
  const awardXp = async (actionType: string, documentName: string = 'Document') => {
    setIsLoading(true);

    try {
      // Vérifier que le type d'action est valide
      if (!VALID_ACTION_TYPES.includes(actionType)) {
        console.error(`Type d'action non valide: ${actionType}. Types valides: ${VALID_ACTION_TYPES.join(', ')}`);
        throw new Error(`Type d'action non valide. Types autorisés: ${VALID_ACTION_TYPES.join(', ')}`);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Non authentifié");
      }

      const userId = session.user.id;
      const xpAmount = XP_VALUES[actionType as keyof typeof XP_VALUES] || 0;

      // 1. Mettre à jour les XP utilisateur
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ 
          xp: supabase.rpc('increment', { value: xpAmount }),
          level: supabase.rpc('calculate_level', { current_xp: supabase.rpc('get_user_xp', { user_id_param: userId }) })
        })
        .eq('id', userId);

      if (userUpdateError) {
        console.error("Erreur lors de la mise à jour des XP:", userUpdateError);
        throw userUpdateError;
      }

      // 2. Ajouter une entrée dans l'historique
      const { error: historyError } = await supabase
        .from('history')
        .insert({
          user_id: userId,
          action_type: actionType,
          document_name: documentName,
          xp_gained: xpAmount
        });

      if (historyError) {
        console.error("Erreur lors de l'ajout à l'historique:", historyError);
        throw historyError;
      }

      return true;
    } catch (error: any) {
      console.error("Erreur complète lors de l'attribution des XP:", error);
      
      toast({
        title: "Erreur d'attribution XP",
        description: "Impossible d'attribuer des XP. Réessayez plus tard.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    awardXp,
    isLoading
  };
}
