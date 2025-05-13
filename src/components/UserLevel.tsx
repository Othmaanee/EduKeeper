
import React, { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useXPStore } from '@/store/xpStore';

interface UserLevelProps {
  className?: string;
}

export function UserLevel({ className }: UserLevelProps) {
  const { xp, level, isLoading, fetchUserXP } = useXPStore();
  
  useEffect(() => {
    fetchUserXP();
  }, [fetchUserXP]);
  
  // Calcul des XP dans le niveau actuel et de la progression vers le prochain niveau
  const xpInCurrentLevel = xp % 100;
  const progressPercentage = xpInCurrentLevel;
  
  // Déterminer le message motivant basé sur la progression
  const getMotivationalMessage = () => {
    if (xpInCurrentLevel < 25) return "Commence bien !";
    if (xpInCurrentLevel < 50) return "Continue comme ça !";
    if (xpInCurrentLevel < 75) return "Tu avances bien !";
    return "Presque au niveau suivant !";
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center">
          <Trophy className="h-5 w-5 text-amber-500" />
          <div className="font-medium ml-2">Chargement...</div>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <div className="font-medium">Niveau {level}</div>
        <Badge variant="outline" className="ml-auto border-amber-200 bg-amber-50 text-amber-700">
          {xp} XP
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{xpInCurrentLevel}/100 XP</span>
          <span className="flex items-center text-muted-foreground">
            Niveau {level+1}
            <ChevronUp className="h-3 w-3 ml-1" />
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      <div className="text-xs text-muted-foreground italic">
        {getMotivationalMessage()}
      </div>
    </div>
  );
}
