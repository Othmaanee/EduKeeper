
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useXPStore } from "@/store/xpStore";

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

// Définir le type pour les clés de XP_VALUES
export type ActionType = keyof typeof XP_VALUES;

export function useXp() {
  const [isAwarding, setIsAwarding] = useState(false);
  const { toast } = useToast();
  const updateXP = useXPStore(state => state.updateXP);

  /**
   * Attribuer de l'XP à l'utilisateur pour une action spécifique
   * @param actionType Type d'action réalisée
   * @param documentName Nom du document ou de l'objet concerné
   */
  const awardXp = async (actionType: ActionType, documentName: string) => {
    console.log(`awardXp appelé avec: ${actionType}, ${documentName}`);
    try {
      setIsAwarding(true);
      
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("Utilisateur non connecté, XP non attribuée");
        return { success: false, error: "Utilisateur non connecté" };
      }
      
      const userId = session.user.id;
      const xpAmount = XP_VALUES[actionType] || 0;
      
      console.log(`Utilisateur: ${userId}, XP à attribuer: ${xpAmount}`);
      
      // Récupérer le niveau et l'XP actuel de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error("Erreur lors de la récupération des données utilisateur:", userError);
        throw userError;
      }
      
      console.log(`Données utilisateur récupérées:`, userData);
      
      // Calculer la nouvelle XP et le nouveau niveau
      const currentXp = userData?.xp || 0; // S'assurer que nous avons une valeur même si null
      const newXp = currentXp + xpAmount;
      
      // Formule simple de calcul de niveau : niveau = racine carrée de xp/100 arrondie à l'entier inférieur + 1
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
      
      console.log(`XP actuelle: ${currentXp}, Nouvelle XP: ${newXp}, Nouveau niveau: ${newLevel}`);
      
      // 1. Mettre à jour les XP utilisateur avec un upsert pour être sûr
      const { error: userUpdateError, data: updateResult } = await supabase
        .from('users')
        .update({ 
          xp: newXp,
          level: newLevel
        })
        .eq('id', userId)
        .select('xp, level');
        
      if (userUpdateError) {
        console.error("Erreur lors de la mise à jour des XP:", userUpdateError);
        throw userUpdateError;
      }
      
      console.log("Résultat de la mise à jour:", updateResult);
      
      // 2. Ajouter une entrée dans l'historique
      // Convertir actionType à une valeur acceptée par la contrainte de la base de données
      let historyActionType: string;
      
      switch (actionType) {
        case 'generate_exercises':
          historyActionType = 'génération';
          break;
        case 'generate_summary':
          historyActionType = 'génération';
          break;
        case 'generate_control':
          historyActionType = 'génération';
          break;
        case 'document_upload':
          historyActionType = 'upload';
          break;
        case 'document_view':
          historyActionType = 'consultation';
          break;
        case 'document_share':
          historyActionType = 'partage';
          break;
        case 'create_category':
          historyActionType = 'organisation';
          break;
        default:
          historyActionType = 'action';
      }
      
      const { error: historyError } = await supabase
        .from('history')
        .insert({
          user_id: userId,
          action_type: historyActionType,
          document_name: documentName,
          xp_gained: xpAmount
        });
        
      if (historyError) {
        console.error("Erreur lors de l'ajout dans l'historique:", historyError);
        // Ne pas bloquer le processus si l'historique échoue
        console.warn("L'historique n'a pas pu être mis à jour, mais les XP ont été ajoutées");
      }
      
      // Mettre à jour le store global XP
      updateXP(newXp, newLevel);
      
      // Montrer un toast de félicitations si le niveau a augmenté
      if (newLevel > userData.level) {
        console.log(`Niveau augmenté! ${userData.level} -> ${newLevel}`);
        toast({
          title: `Niveau ${newLevel} atteint !`,
          description: `Félicitations ! Vous avez atteint le niveau ${newLevel}.`,
          className: "bg-amber-500 text-white"
        });
      } else {
        // Afficher un toast pour indiquer les XP gagnés même si le niveau n'a pas changé
        toast({
          title: `+${xpAmount} XP`,
          description: `Vous avez gagné ${xpAmount} XP pour cette action !`,
          className: "bg-blue-100 border-blue-300"
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
