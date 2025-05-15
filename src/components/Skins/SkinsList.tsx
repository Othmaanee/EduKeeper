
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { SkinItem } from './SkinItem';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { useXPStore } from '@/store/xpStore';

// Définition des types de skins disponibles
export const SKINS = [
  { id: 'base', name: 'Base', colorClass: 'bg-slate-200', requiredLevel: 1 },
  { id: 'avance', name: 'Avancé', colorClass: 'bg-blue-200', requiredLevel: 3 },
  { id: 'pro', name: 'Pro', colorClass: 'bg-purple-200', requiredLevel: 5 },
  { id: 'expert', name: 'Expert', colorClass: 'bg-amber-200', requiredLevel: 10 },
  { id: 'maitre', name: 'Maître', colorClass: 'bg-emerald-200', requiredLevel: 15 }
];

export function SkinsList() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const { xp, level, fetchUserXP } = useXPStore();

  useEffect(() => {
    async function getUserData() {
      try {
        // Récupérer la session utilisateur
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return;
        }
        
        // Charger les XP et niveau depuis le store global
        await fetchUserXP();
        
        // Récupérer le skin actuel de l'utilisateur
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, skin')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        
        setCurrentUser({
          ...userData,
          xp, // Utiliser les données du store global
          level // Utiliser les données du store global
        });
      } catch (error: any) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue, veuillez réessayer.',
          variant: 'destructive'
        });
      }
    }
    
    getUserData();
  }, [toast, fetchUserXP, xp, level]);

  // Si l'utilisateur n'est pas connecté, afficher un message
  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Connectez-vous pour voir vos skins disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-4xl">
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-medium">Votre niveau : {currentUser.level}</h2>
          <Badge variant="outline" className="ml-auto">
            {currentUser.xp} XP
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Vous pouvez débloquer de nouveaux skins en gagnant de l'expérience. Chaque skin change l'apparence de l'interface.
        </p>
        <div className="bg-primary/5 rounded-md p-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Skin actuellement actif : </span>
          <Badge className="ml-auto sm:ml-2">{SKINS.find(skin => skin.id === currentUser.skin)?.name || currentUser.skin}</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SKINS.map(skin => (
          <SkinItem 
            key={skin.id}
            skin={skin}
            isUnlocked={currentUser.level >= skin.requiredLevel}
            isActive={currentUser.skin === skin.id}
            userId={currentUser.id}
          />
        ))}
      </div>
    </div>
  );
}
