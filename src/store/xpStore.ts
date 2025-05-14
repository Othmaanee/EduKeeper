
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface XPState {
  xp: number;
  level: number;
  isLoading: boolean;
  fetchUserXP: () => Promise<void>;
  updateXP: (newXp: number, newLevel: number) => void;
}

export const useXPStore = create<XPState>((set) => ({
  xp: 0,
  level: 1,
  isLoading: true,
  
  fetchUserXP: async () => {
    set({ isLoading: true });
    try {
      // Récupérer la session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("XPStore: Aucune session utilisateur trouvée");
        set({ isLoading: false });
        return;
      }
      
      console.log("XPStore: Session utilisateur trouvée, récupération des XP...");
      
      // Récupérer l'XP et le niveau de l'utilisateur avec une requête distincte
      // pour éviter les problèmes de mise en cache
      const { data, error } = await supabase
        .from('users')
        .select('xp, level')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error("Erreur lors de la récupération de l'XP:", error);
        set({ isLoading: false });
        return;
      }
      
      console.log("XP Store: données récupérées depuis Supabase:", data);
      
      // Vérifier que les valeurs ne sont pas nulles ou indéfinies
      const safeXp = data?.xp !== undefined && data?.xp !== null ? data.xp : 0;
      const safeLevel = data?.level !== undefined && data?.level !== null ? data.level : 1;
      
      console.log("XP Store: valeurs sécurisées:", { safeXp, safeLevel });
      
      set({ 
        xp: safeXp, 
        level: safeLevel,
        isLoading: false 
      });
    } catch (error) {
      console.error("Erreur lors du chargement de l'XP:", error);
      set({ isLoading: false });
    }
  },
  
  updateXP: (newXp, newLevel) => {
    console.log("XP Store: mise à jour avec", { newXp, newLevel });
    set({ xp: newXp, level: newLevel });
  }
}));
