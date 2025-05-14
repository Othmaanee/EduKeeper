
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useXPStore } from "@/store/xpStore";

// Valeurs d'XP pour différentes actions
const XP_VALUES = {
  document_upload: 10,
  document_view: 5,
  document_share: 15,
  generate_summary: 40,
  generate_exercises: 30,
  generate_control: 40
};

// Définir le type pour les clés de XP_VALUES
export type ActionType = keyof typeof XP_VALUES;

// Définir le type de réponse pour l'attribution d'XP
interface AwardXpResponse {
  success: boolean;
  xpAwarded?: number;
  newXp?: number;
  newLevel?: number;
  error?: any;
}

export function useXp() {
  const [isAwarding, setIsAwarding] = useState(false);
  const { toast } = useToast();
  const { xp, level, updateXP, fetchUserXP } = useXPStore();

  /**
   * Attribue de l'XP pour une action spécifique
   * @param actionType Type d'action réalisée
   * @param documentName Nom du document ou de l'objet concerné
   */
  const awardXp = async (actionType: ActionType, documentName: string): Promise<AwardXpResponse> => {
    console.log(`awardXp appelé avec: ${actionType}, ${documentName}`);
    try {
      setIsAwarding(true);
      
      // Vérifier si l'action est valide
      if (!Object.keys(XP_VALUES).includes(actionType)) {
        console.error(`Type d'action invalide: ${actionType}`);
        return { success: false, error: `Type d'action invalide: ${actionType}` };
      }
      
      // Récupérer la session utilisateur
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("Erreur de session:", sessionError);
        return { success: false, error: sessionError || "Aucune session active" };
      }
      
      const userId = session.user.id;
      console.log(`ID utilisateur: ${userId}`);
      
      // Récupérer les données actuelles de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error("Erreur lors de la récupération des données utilisateur:", userError);
        return { success: false, error: userError };
      }
      
      console.log("Données utilisateur actuelles:", userData);
      
      // Calculer la nouvelle XP
      const xpAmount = XP_VALUES[actionType];
      const currentXp = userData?.xp || 0;
      const newXp = currentXp + xpAmount;
      
      console.log(`Attribution de ${xpAmount} XP. XP actuelle: ${currentXp}, nouvelle XP: ${newXp}`);
      
      // Enregistrer l'action dans l'historique
      const { error: historyError } = await supabase
        .from('history')
        .insert([
          {
            user_id: userId,
            action_type: actionType,
            document_name: documentName,
            xp_gained: xpAmount
          }
        ]);
        
      if (historyError) {
        console.error("Erreur lors de l'enregistrement dans l'historique:", historyError);
        // On continue malgré l'erreur d'historique
      }
      
      // CORRECTION IMPORTANTE: Utiliser une requête RPC (Remote Procedure Call) pour contourner les problèmes potentiels
      // Cette requête va directement mettre à jour la base de données avec une fonction SQL
      const { data, error: userUpdateError } = await supabase.rpc('update_user_xp', {
        user_id: userId,
        new_xp: newXp
      });
      
      if (userUpdateError) {
        console.error("Erreur lors de la mise à jour de l'XP:", userUpdateError);
        throw userUpdateError;
      }
      
      console.log("Réponse de update_user_xp:", data);
      
      // Récupérer les données mises à jour de l'utilisateur pour confirmer le changement
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        console.error("Erreur lors de la récupération des données mises à jour:", fetchError);
        throw fetchError;
      }
      
      if (!updatedUser) {
        console.error("Données utilisateur non disponibles après mise à jour");
        return { success: false, error: "Données utilisateur non disponibles" };
      }
      
      console.log("Données utilisateur après mise à jour:", updatedUser);
      
      // Vérifier si le niveau a changé
      const previousLevel = Math.floor(currentXp / 100) + 1;
      const newLevel = Math.floor(newXp / 100) + 1;
      const confirmedXp = updatedUser.xp;
      
      console.log(`Niveau précédent: ${previousLevel}, nouveau niveau: ${newLevel}`);
      
      // Mettre à jour le store local
      if (updateXP) {
        updateXP(confirmedXp, newLevel);
        console.log("XP mise à jour dans le store");
      } else {
        console.warn("Fonction updateXP non disponible dans le store");
      }
      
      // Actualiser les données utilisateur si disponible
      if (fetchUserXP) {
        fetchUserXP();
        console.log("fetchUserXP appelé pour rafraîchir les données");
      }
      
      // Afficher une notification en fonction du résultat
      if (previousLevel < newLevel) {
        // Niveau augmenté, affichage d'une notification de montée de niveau
        toast({
          title: `🎉 Niveau ${newLevel} atteint !`,
          description: `+${xpAmount} XP - Vous avez gagné un niveau!`,
          variant: "default",
          className: "bg-green-500 text-white border-green-600"
        });
      } else {
        // Simple gain d'XP
        toast({
          title: `+${xpAmount} XP`,
          description: `Pour: ${actionType.replace('_', ' ')}`,
          variant: "default",
          className: "bg-green-500 text-white border-green-600"
        });
      }
      
      return { 
        success: true, 
        xpAwarded: xpAmount, 
        newXp: confirmedXp, 
        newLevel 
      };
    } catch (error) {
      console.error("Erreur lors de l'attribution d'XP:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer de l'XP. Veuillez réessayer.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsAwarding(false);
    }
  };

  return {
    awardXp,
    isAwarding,
    currentXp: xp,
    currentLevel: level
  };
}
