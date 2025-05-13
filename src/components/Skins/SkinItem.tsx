
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SkinItemProps {
  skin: {
    id: string;
    name: string;
    colorClass: string;
    requiredLevel: number;
  };
  isUnlocked: boolean;
  isActive: boolean;
  userId: string;
}

export function SkinItem({ skin, isUnlocked, isActive, userId }: SkinItemProps) {
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const activateSkin = async () => {
    if (!isUnlocked) return;
    
    try {
      setIsActivating(true);
      
      const { error } = await supabase
        .from('users')
        .update({ skin: skin.id })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast({
        title: "Skin activé",
        description: `Le skin ${skin.name} a été activé avec succès.`,
      });
      
      // Recharger la page pour appliquer les changements visuels
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur lors de l\'activation du skin:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer le skin. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };
  
  return (
    <Card className={`overflow-hidden transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}>
      <div className={`h-3 w-full ${skin.colorClass}`}></div>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="font-medium">{skin.name}</h3>
        {isActive && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Actif
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-3 items-center mb-3">
          <div className={`w-10 h-10 rounded-md flex items-center justify-center ${skin.colorClass}`}>
            <Crown className={`h-6 w-6 ${isUnlocked ? 'text-primary' : 'text-muted'}`} />
          </div>
          <div>
            <p className="text-sm font-medium">Niveau requis : {skin.requiredLevel}</p>
            <p className="text-xs text-muted-foreground">
              {isUnlocked ? 'Débloqué' : 'Non débloqué'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`w-3 h-3 rounded-full ${skin.colorClass}`}></div>
          <span>Thème {skin.name.toLowerCase()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={isActive ? "outline" : "default"} 
          size="sm" 
          disabled={!isUnlocked || isActive || isActivating}
          onClick={activateSkin}
          className="w-full"
        >
          {isActive ? 'Actuellement actif' : isUnlocked ? 'Activer' : 'Verrouillé'}
        </Button>
      </CardFooter>
    </Card>
  );
}
