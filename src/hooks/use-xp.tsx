
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Définir la structure des valeurs XP pour différentes actions
const XP_VALUES = {
  document_upload: 10,
  document_view: 5,
  document_share: 8,
  generate_summary: 20,
  generate_control: 40,
  generate_exercises: 30,
  create_category: 15
};

export function useXp() {
  const [isAwarding, setIsAwarding] = useState(false);
  const { toast } = useToast();

  /**
   * Attribuer de l'XP à l'utilisateur pour une action spécifique
   * @param actionType Type d'action réalisée
   * @param documentName Nom du document ou de l'objet concerné
   */
  const awardXp = async (actionType: keyof typeof XP_VALUES, documentName: string) => {
    try {
      setIsAwarding(true);
      
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("Utilisateur non connecté, XP non attribuée");
        return;
      }
      
      const userId = session.user.id;
      const xpAmount = XP_VALUES[actionType] || 0;
      
      // Récupérer le niveau et l'XP actuel de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();
        
      if (userError) throw userError;
      
      // Calculer la nouvelle XP et le nouveau niveau
      const newXp = (userData.xp || 0) + xpAmount;
      
      // Formule simple de calcul de niveau : niveau = racine carrée de xp/100 arrondie à l'entier inférieur + 1
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
      
      // 1. Mettre à jour les XP utilisateur
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ 
          xp: newXp,
          level: newLevel
        })
        .eq('id', userId);
        
      if (userUpdateError) throw userUpdateError;
      
      // 2. Ajouter une entrée dans l'historique
      const { error: historyError } = await supabase
        .from('history')
        .insert({
          user_id: userId,
          action_type: actionType,
          document_name: documentName,
          xp_gained: xpAmount
        });
        
      if (historyError) throw historyError;
      
      // Montrer un toast de félicitations si le niveau a augmenté
      if (newLevel > userData.level) {
        toast({
          title: `Niveau ${newLevel} atteint !`,
          description: `Félicitations ! Vous avez atteint le niveau ${newLevel}.`,
          className: "bg-amber-500 text-white"
        });
      }
      
      return { success: true, xpAwarded: xpAmount, newXp, newLevel };
    } catch (error) {
      console.error("Erreur lors de l'attribution d'XP:", error);
      return { success: false, error };
    } finally {
      setIsAwarding(false);
    }
  };

  return { awardXp, isAwarding };
}
