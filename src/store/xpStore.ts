
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
        set({ isLoading: false });
        return;
      }
      
      // Récupérer l'XP et le niveau de l'utilisateur
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
      
      set({ 
        xp: data.xp, 
        level: data.level,
        isLoading: false 
      });
    } catch (error) {
      console.error("Erreur lors du chargement de l'XP:", error);
      set({ isLoading: false });
    }
  },
  
  updateXP: (newXp, newLevel) => {
    set({ xp: newXp, level: newLevel });
  }
}));
