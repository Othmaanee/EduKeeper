
import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Unlock, Crown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
      
      // Recharger la page pour appliquer les changements visuels
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur lors de l\'activation du skin:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue, veuillez réessayer.",
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
        <h3 className="font-medium">🎨 Skin {skin.name}</h3>
        {isActive && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Check className="h-3 w-3 mr-1" /> Actif
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
            <div className="flex items-center mt-1">
              {isUnlocked ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  <Check className="h-3 w-3 mr-1" /> Débloqué
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                  <Lock className="h-3 w-3 mr-1" /> Verrouillé
                </Badge>
              )}
            </div>
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
          {isActive ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Skin actuel
            </>
          ) : isActivating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Activation...
            </>
          ) : isUnlocked ? (
            <>
              <Unlock className="h-4 w-4 mr-2" />
              Activer
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Verrouillé
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
