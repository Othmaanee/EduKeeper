
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { SkinItem } from './SkinItem';
import { Badge } from '@/components/ui/badge';
import { Trophy, Loader2 } from 'lucide-react';
import { useXPStore } from '@/store/xpStore';
import { Button } from '@/components/ui/button';

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
  const { xp, level, fetchUserXP, isLoading: xpLoading } = useXPStore();
  
  const loadUserData = async () => {
    try {
      console.log("Chargement des données utilisateur...");
      setLoading(true);
      setError(null);
      
      // Récupérer la session utilisateur
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erreur de session:", sessionError);
        setError("Erreur lors de la récupération de votre session: " + sessionError.message);
        return;
      }
      
      if (!session) {
        console.log("Aucune session trouvée");
        setError("Vous devez être connecté pour voir vos skins.");
        setLoading(false);
        return;
      }
      
      console.log("Session utilisateur récupérée:", session.user.id);
      
      // Charger les XP et niveau depuis le store global
      await fetchUserXP();
      
      // Récupérer le skin actuel de l'utilisateur
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, skin')
        .eq('id', session.user.id)
        .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs
          
      if (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
        setError("Impossible de charger vos données. Veuillez réessayer.");
        return;
      }
      
      if (!userData) {
        console.log("Aucune donnée utilisateur trouvée");
        setError("Aucune donnée utilisateur trouvée.");
        return;
      }
      
      console.log("Données utilisateur récupérées:", userData);
      console.log("XP et niveau du store:", { xp, level });
      
      setCurrentUser({
        ...userData,
        xp, // Utiliser les données du store global
        level // Utiliser les données du store global
      });
      
      console.log("État currentUser mis à jour:", userData.id, xp, level);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      setError("Une erreur est survenue lors du chargement de vos données: " + error.message);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue, veuillez réessayer.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    console.log("useEffect déclenché");
    loadUserData();
  }, []); // Supprimer les dépendances pour éviter des rechargements en boucle
  
  // Effect séparé pour mettre à jour l'utilisateur lorsque xp/level change
  useEffect(() => {
    if (currentUser && (xp !== undefined && level !== undefined)) {
      console.log("Mise à jour de currentUser avec nouveaux XP/level:", xp, level);
      setCurrentUser(prev => prev ? {...prev, xp, level} : null);
    }
  }, [xp, level]);

  const handleRetry = () => {
    loadUserData();
  };

  if (loading || xpLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Chargement de vos skins...</p>
      </div>
    );
  } 
  
  if (error) {
    return (
      <div className="text-center py-8">
        <Card className="p-6 bg-destructive/10">
          <p className="text-destructive mb-4">{error}</p>
          <Button 
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <p className="text-amber-800 mb-4">Données utilisateur non disponibles.</p>
          <Button 
            onClick={handleRetry}
            className="mt-2"
          >
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-4xl">
      <Card className="p-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-medium">Votre niveau : {currentUser.level || 1}</h2>
          <Badge variant="outline" className="ml-auto">
            {currentUser.xp || 0} XP
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
