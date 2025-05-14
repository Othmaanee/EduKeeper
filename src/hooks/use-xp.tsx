
import { useState } from 'react';
import { useXPStore } from '@/store/xpStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Valeurs d'XP pour différentes actions
const XP_VALUES = {
  document_upload: 10,
  generate_summary: 5,
  generate_exercises: 5,
  generate_control: 5,
  document_view: 1,
  document_share: 2,
  create_category: 3,
  complete_exercise: 2,
  profile_complete: 5,
  daily_login: 1
} as const;

// Type dérivé des clés de XP_VALUES
type XpActionType = keyof typeof XP_VALUES;

// Type de retour pour les fonctions d'XP
interface XpResult {
  xp: number;
  level: number;
  success: boolean;
  error?: any;
}

export const useXp = () => {
  const { xp: currentXp, level: currentLevel, fetchUserXP, updateXP } = useXPStore();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Attribue de l'XP pour une action spécifique et met à jour la base de données
   */
  const awardXP = async (actionType: XpActionType, documentName: string): Promise<XpResult> => {
    setLoading(true);
    
    try {
      console.log(`Tentative d'attribution d'XP pour l'action: ${actionType}`);
      
      // Récupérer la session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error("Impossible d'attribuer de l'XP: aucune session utilisateur");
        return { success: false, xp: currentXp, level: currentLevel, error: "Non authentifié" };
      }
      
      const userId = session.user.id;
      
      // Déterminer la quantité d'XP à attribuer
      const xpToAward = XP_VALUES[actionType];
      console.log(`XP à attribuer: ${xpToAward}`);
      
      // Récupérer l'XP actuelle de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error("Erreur lors de la récupération de l'XP utilisateur:", userError);
        return { success: false, xp: currentXp, level: currentLevel, error: userError };
      }
      
      // Calculer la nouvelle XP
      const newXp = (userData?.xp || 0) + xpToAward;
      console.log(`Nouvelle XP totale: ${newXp}`);
      
      // Calculer le nouveau niveau (formule simple: niveau = XP / 100 + 1)
      const newLevel = Math.floor(newXp / 100) + 1;
      console.log(`Nouveau niveau: ${newLevel}`);
      
      // Mettre à jour l'XP de l'utilisateur dans la base de données
      const { error: updateError } = await supabase.rpc('update_user_xp', {
        user_id: userId,
        new_xp: newXp
      });
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour de l'XP:", updateError);
        return { success: false, xp: currentXp, level: currentLevel, error: updateError };
      }
      
      // Enregistrer l'action dans l'historique
      await supabase.from('history').insert({
        user_id: userId,
        action_type: actionType,
        document_name: documentName,
        xp_gained: xpToAward
      });
      
      // Mettre à jour le state local
      updateXP(newXp, newLevel);
      
      // Vérifier si l'utilisateur a gagné un niveau
      const levelUp = newLevel > (userData?.level || 1);
      
      if (levelUp) {
        toast({
          title: "🎉 Niveau supérieur !",
          description: `Félicitations ! Vous avez atteint le niveau ${newLevel}.`,
        });
      } else if (actionType !== 'document_view') { // Ne pas afficher pour les vues de document
        toast({
          description: `+${xpToAward} XP pour ${getActionDescription(actionType)}`,
        });
      }
      
      return { 
        success: true, 
        xp: newXp, 
        level: newLevel
      };
      
    } catch (error) {
      console.error("Erreur lors de l'attribution d'XP:", error);
      return { success: false, xp: currentXp, level: currentLevel, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtient une description lisible de l'action
   */
  const getActionDescription = (actionType: XpActionType): string => {
    switch (actionType) {
      case 'document_upload':
        return "importation de document";
      case 'generate_summary':
        return "génération de résumé";
      case 'generate_exercises':
        return "génération d'exercices";
      case 'generate_control':
        return "génération de contrôle";
      case 'document_view':
        return "lecture de document";
      case 'document_share':
        return "partage de document";
      case 'create_category':
        return "création de catégorie";
      case 'complete_exercise':
        return "exercice complété";
      case 'profile_complete':
        return "profil complété";
      case 'daily_login':
        return "connexion quotidienne";
      default:
        return "action";
    }
  };

  /**
   * Récupère le nombre d'actions IA effectuées ce mois-ci
   */
  const getMonthlyAIUsage = async (): Promise<number> => {
    try {
      // Récupérer la session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return 0;
      }
      
      const userId = session.user.id;
      
      // Définir le début du mois en cours
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Compter les actions liées à l'IA
      const { count, error } = await supabase
        .from('history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
        .or('action_type.eq.generate_summary,action_type.eq.generate_exercises,action_type.eq.generate_control');
      
      if (error) {
        console.error("Erreur lors de la récupération de l'utilisation mensuelle:", error);
        return 0;
      }
      
      return count || 0;
      
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisation mensuelle:", error);
      return 0;
    }
  };

  /**
   * Vérifie si l'utilisateur a déjà effectué une action aujourd'hui
   */
  const hasCompletedActionToday = async (actionType: XpActionType): Promise<boolean> => {
    try {
      // Récupérer la session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }
      
      const userId = session.user.id;
      
      // Définir le début de la journée
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      // Vérifier l'historique
      const { count, error } = await supabase
        .from('history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action_type', actionType)
        .gte('created_at', startOfDay.toISOString());
      
      if (error) {
        console.error("Erreur lors de la vérification de l'historique:", error);
        return false;
      }
      
      return (count || 0) > 0;
      
    } catch (error) {
      console.error("Erreur lors de la vérification de l'historique:", error);
      return false;
    }
  };

  return {
    awardXP,
    fetchUserXP,
    getMonthlyAIUsage,
    hasCompletedActionToday,
    loading,
  };
};

// Pour la compatibilité avec le code existant qui pourrait utiliser useXP au lieu de useXp
export const useXP = useXp;
