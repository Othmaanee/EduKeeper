
import { useToast } from "./use-toast";
import { useState, useCallback, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useXPStore } from "@/store/xpStore";

type XpActionType = 
  | 'document_upload'
  | 'generate_exercises'
  | 'generate_summary'
  | 'login'
  | 'comment'
  | 'chat_completion'
  | 'share_document'
  | 'generate_control';  // Ajout du type manquant

interface UseXpReturn {
  awardXp: (actionType: XpActionType, actionDescription?: string) => Promise<{ 
    success: boolean;
    error?: string;
    xpAwarded?: number;
    newXp?: number;
  }>;
  gainedXp: number | null;
}

export const useXp = (): UseXpReturn => {
  const { toast } = useToast();
  const [gainedXp, setGainedXp] = useState<number | null>(null);
  const { setXp, incrementXp } = useXPStore();

  // Fonction pour récupérer les XP de l'utilisateur depuis Supabase
  const fetchUserXp = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('users')
        .select('xp')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("Erreur lors de la récupération des XP:", error);
        return null;
      }

      if (data) {
        setXp(data.xp);
        return data.xp;
      }

      return null;
    } catch (error) {
      console.error("Exception lors de la récupération des XP:", error);
      return null;
    }
  }, [setXp]);

  // Synchroniser le store local avec la base de données au chargement
  useEffect(() => {
    fetchUserXp();
  }, [fetchUserXp]);

  // Fonction pour attribuer des XP à l'utilisateur
  const awardXp = useCallback(async (
    actionType: XpActionType, 
    actionDescription: string = ""
  ) => {
    console.log(`Tentative d'attribution d'XP pour l'action: ${actionType}`);

    try {
      // Mapping des actions et des valeurs d'XP
      const xpMapping: Record<XpActionType, number> = {
        document_upload: 10,
        generate_exercises: 5,
        generate_summary: 5,
        login: 1,
        comment: 2,
        chat_completion: 3,
        share_document: 5,
        generate_control: 40  // Ajout de la nouvelle action
      };

      // Déterminer le montant d'XP à attribuer
      const xpToAward = xpMapping[actionType] || 0;
      
      if (xpToAward <= 0) {
        console.log(`Aucun XP à attribuer pour l'action: ${actionType}`);
        return { success: false, error: "Action non reconnue" };
      }

      // Récupérer les informations de session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("Attribution d'XP annulée: aucune session active");
        return { success: false, error: "Non authentifié" };
      }

      // Incrémenter localement les XP avant l'enregistrement en base
      incrementXp(xpToAward);
      setGainedXp(xpToAward);
      
      console.log(`Tentative d'attribution de ${xpToAward} XP à l'utilisateur ${session.user.id}`);

      // Appeler une fonction RPC dédiée pour la mise à jour sécurisée des XP
      const { data, error } = await supabase.rpc('update_user_xp', {
        user_id: session.user.id,
        xp_to_add: xpToAward,
        action_type: actionType,
        action_description: actionDescription
      });

      if (error) {
        console.error("Erreur lors de la mise à jour des XP:", error);
        return { success: false, error: error.message };
      }

      // Sécuriser l'accès aux données
      if (!data) {
        console.log("Aucune donnée retournée par la fonction RPC");
        return { 
          success: true, 
          xpAwarded: xpToAward, 
          newXp: null 
        };
      }

      // Supposons que la fonction renvoie la nouvelle valeur XP
      const newXpValue = data?.new_xp || null;
      
      console.log(`XP attribués avec succès: ${xpToAward}, nouvelle valeur: ${newXpValue}`);

      toast({
        title: `Félicitations! Vous avez gagné ${xpToAward} points d'expérience!`,
        description: "",
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });

      // Re-synchroniser avec la base de données après attribution
      const updatedXp = await fetchUserXp();

      return { 
        success: true, 
        xpAwarded: xpToAward, 
        newXp: updatedXp || newXpValue 
      };
    } catch (error: any) {
      console.error("Erreur lors de l'attribution des XP:", error);
      return { success: false, error: error.message };
    }
  }, [incrementXp, toast, fetchUserXp]);

  return {
    awardXp,
    gainedXp,
  };
};
