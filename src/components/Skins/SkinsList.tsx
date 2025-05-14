
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { SkinItem } from './SkinItem';
import { Badge } from '@/components/ui/badge';
import { Trophy, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { xp, level, fetchUserXP } = useXPStore();

  useEffect(() => {
    async function getUserData() {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer la session utilisateur
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          setError("Vous devez être connecté pour voir vos skins.");
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
          
        if (error) {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
          setError("Impossible de charger vos données. Veuillez réessayer.");
          setLoading(false);
          return;
        }
        
        if (!userData) {
          setError("Aucune donnée utilisateur trouvée.");
          setLoading(false);
          return;
        }
        
        setCurrentUser({
          ...userData,
          xp, // Utiliser les données du store global
          level // Utiliser les données du store global
        });
      } catch (error: any) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        setError("Une erreur est survenue lors du chargement de vos données.");
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue, veuillez réessayer.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    getUserData();
  }, [toast, fetchUserXP, xp, level]);

  return (
    <div className="space-y-6 mx-auto max-w-4xl">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p>Chargement de vos skins...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <Card className="p-6 bg-destructive/10">
            <p className="text-destructive">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Réessayer
            </button>
          </Card>
        </div>
      ) : currentUser ? (
        <>
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
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Connectez-vous pour voir vos skins disponibles.</p>
        </div>
      )}
    </div>
  );
}
