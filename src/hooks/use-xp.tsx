
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Définir les types d'actions qui peuvent générer de l'XP
export type XpActionType = 
  | 'document_upload'
  | 'generate_summary'
  | 'generate_exercises'
  | 'generate_control'
  | 'complete_exercise'
  | 'profile_complete'
  | 'daily_login';

// Valeurs d'XP pour chaque type d'action
const XP_VALUES: Record<XpActionType, number> = {
  document_upload: 5,
  generate_summary: 10,
  generate_exercises: 15,
  generate_control: 20,
  complete_exercise: 25,
  profile_complete: 50,
  daily_login: 3
};

// Interface pour le résultat de l'attribution d'XP
export interface XpResult {
  success: boolean;
  message: string;
  xpEarned?: number;
  newLevel?: number;
  newTotalXp?: number;
}

// Hook personnalisé pour gérer l'XP
export function useXp() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Attribuer de l'XP à l'utilisateur pour une action spécifique
  const awardXP = async (actionType: XpActionType): Promise<XpResult> => {
    setIsLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error("Aucune session utilisateur trouvée");
        return { 
          success: false, 
          message: "Veuillez vous connecter pour gagner de l'XP" 
        };
      }
      
      const userId = sessionData.session.user.id;
      const xpValue = XP_VALUES[actionType];
      
      // Vérifier si l'utilisateur a déjà effectué cette action aujourd'hui
      // pour les actions limitées à une fois par jour
      if (actionType === 'daily_login') {
        const alreadyDone = await hasCompletedActionToday(userId, actionType);
        if (alreadyDone) {
          console.log("Action déjà complétée aujourd'hui");
          return { 
            success: false, 
            message: "Vous avez déjà gagné de l'XP pour cette action aujourd'hui" 
          };
        }
      }
      
      // Enregistrer l'action dans l'historique XP
      const { error: historyError } = await supabase
        .from('history')
        .insert({
          user_id: userId,
          action_type: actionType,
          xp_gained: xpValue,
          document_name: `Action: ${actionType}`
        });
      
      if (historyError) {
        console.error("Erreur lors de l'enregistrement de l'historique XP:", historyError);
        return { 
          success: false, 
          message: "Erreur lors de l'attribution de l'XP" 
        };
      }
      
      // Mettre à jour l'XP totale de l'utilisateur
      // Cette opération est gérée par un trigger côté base de données
      
      // Récupérer les informations mises à jour de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error("Erreur lors de la récupération des données utilisateur:", userError);
        return { 
          success: true, 
          message: `Vous avez gagné ${xpValue} XP!`,
          xpEarned: xpValue 
        };
      }
      
      // Afficher un toast de réussite
      toast({
        title: `+${xpValue} XP gagnés!`,
        description: `Action: ${actionType}`,
        className: "bg-green-500 text-white border-green-600"
      });
      
      return { 
        success: true, 
        message: `Vous avez gagné ${xpValue} XP!`,
        xpEarned: xpValue,
        newTotalXp: userData.xp,
        newLevel: userData.level
      };
      
    } catch (error) {
      console.error("Erreur lors de l'attribution d'XP:", error);
      return { 
        success: false, 
        message: "Une erreur s'est produite lors de l'attribution de l'XP" 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Vérifier si l'utilisateur a déjà réalisé une action aujourd'hui
  const hasCompletedActionToday = async (userId: string, actionType: XpActionType): Promise<boolean> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error } = await supabase
      .from('history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .gte('created_at', today.toISOString());
    
    if (error) {
      console.error("Erreur lors de la vérification de l'historique des actions:", error);
      return false;
    }
    
    return (count || 0) > 0;
  };
  
  return {
    awardXP,
    isLoading,
    hasCompletedActionToday
  };
}
