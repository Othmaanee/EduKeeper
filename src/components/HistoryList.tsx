
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, History, FileText, Trash2, BookOpen, PenTool, BookOpen as BookIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

type HistoryItem = {
  id: string;
  action_type: string;
  document_name: string;
  created_at: string;
};

// Traduction et personnalisation des types d'actions
const translateActionType = (actionType: string): string => {
  const translations: Record<string, string> = {
    'import': 'Document importé',
    'suppression': 'Document supprimé',
    'delete': 'Document supprimé',
    'summary': 'Résumé généré',
    'generate_course': 'Cours généré',
    'generate_exercises': 'Exercices générés',
    'résumé': 'Résumé généré',
    'génération': 'Cours généré',
    'exercice': 'Exercices générés'
  };
  
  return translations[actionType] || actionType;
};

// Obtenir l'icône correspondant au type d'action
const getActionIcon = (actionType: string): React.ReactNode => {
  switch(actionType) {
    case 'import':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'suppression':
    case 'delete':
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'summary':
    case 'résumé':
      return <BookIcon className="h-4 w-4 text-purple-500" />;
    case 'generate_course':
    case 'génération':
      return <BookOpen className="h-4 w-4 text-green-500" />;
    case 'generate_exercises':
    case 'exercice':
      return <PenTool className="h-4 w-4 text-orange-500" />;
    default:
      return <History className="h-4 w-4 text-gray-500" />;
  }
};

// Obtenir la couleur du badge selon le type d'action
const getActionBadgeVariant = (actionType: string): "default" | "secondary" | "destructive" | "outline" => {
  switch(actionType) {
    case 'import':
      return "default";
    case 'suppression':
    case 'delete':
      return "destructive";
    case 'summary':
    case 'résumé':
      return "secondary";
    case 'generate_course':
    case 'génération':
    case 'generate_exercises':
    case 'exercice':
      return "outline";
    default:
      return "default";
  }
};

export const HistoryList: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      // Utiliser une requête SQL brute pour contourner les problèmes de typage
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as HistoryItem[];
    }
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Une erreur est survenue lors du chargement de l'historique.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Aucune action enregistrée</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Vos activités récentes apparaîtront ici dès que vous commencerez à utiliser l'application.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Date et heure</TableHead>
            <TableHead className="w-[200px]">Action</TableHead>
            <TableHead>Détail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {format(new Date(item.created_at), 'dd MMMM yyyy - HH:mm', { locale: fr })}
              </TableCell>
              <TableCell>
                <Badge variant={getActionBadgeVariant(item.action_type)} className="flex items-center gap-2 w-fit">
                  {getActionIcon(item.action_type)}
                  <span>{translateActionType(item.action_type)}</span>
                </Badge>
              </TableCell>
              <TableCell>{item.document_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
