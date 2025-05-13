import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HistoryItem } from './types';
import { Loader2, BookOpenCheck, FileText, Rocket, Trophy } from 'lucide-react';

const HistoryList = () => {
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    
    fetchUserId();
  }, []);

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['history', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        throw error;
      }
      
      return data as HistoryItem[];
    },
    enabled: !!userId, // Activer la requête seulement si userId est disponible
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Chargement de l'historique...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 py-4">
        Erreur lors du chargement de l'historique.
      </div>
    );
  }
  
  if (!history || history.length === 0) {
    return (
      <div className="text-muted-foreground py-4">
        Aucune action enregistrée dans l'historique.
      </div>
    );
  }
  
  const renderHistoryItem = (item: HistoryItem) => {
    let icon = null;
    let description = '';
    
    switch (item.action_type) {
      case 'summarize_document':
        icon = <FileText className="h-4 w-4 mr-2 text-blue-500" />;
        description = `Résumé du document : ${item.document_name}`;
        break;
      case 'generate_control':
        icon = <BookOpenCheck className="h-4 w-4 mr-2 text-green-500" />;
        description = `Génération du contrôle : ${item.document_name}`;
        break;
      case 'generate_exercises':
        icon = <Rocket className="h-4 w-4 mr-2 text-purple-500" />;
        description = `Génération d'exercices : ${item.document_name}`;
        break;
      case 'suppression':
        icon = <Trash className="h-4 w-4 mr-2 text-red-500" />;
        description = `Suppression du document : ${item.document_name}`;
        break;
      default:
        icon = <FileText className="h-4 w-4 mr-2 text-gray-500" />;
        description = `Action inconnue : ${item.action_type} - ${item.document_name}`;
        break;
    }
    
    return (
      <div key={item.id} className="flex items-start py-3 border-b border-gray-100">
        {icon}
        <div className="flex-1">
          <div className="text-sm font-medium">{description}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </div>
        </div>
        
        {item.xp_gained > 0 && (
          <div className="ml-auto flex items-center text-amber-500 text-sm font-medium">
            <Trophy className="h-4 w-4 mr-1" />
            +{item.xp_gained} XP
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div>
      {history.map(item => renderHistoryItem(item))}
    </div>
  );
};

export default HistoryList;

import { Trash } from "lucide-react";
