
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
import { AlertCircle, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type HistoryItem = {
  id: string;
  action_type: string;
  document_name: string;
  created_at: string;
};

const translateActionType = (actionType: string): string => {
  const translations: Record<string, string> = {
    'import': 'Import',
    'génération': 'Génération',
    'résumé': 'Résumé',
    'exercice': 'Exercice',
    'suppression': 'Suppression'
  };
  
  return translations[actionType] || actionType;
};

const getActionIcon = (actionType: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    'import': <span className="text-blue-500">↑</span>,
    'génération': <span className="text-green-500">✦</span>,
    'résumé': <span className="text-purple-500">≡</span>,
    'exercice': <span className="text-orange-500">✎</span>,
    'suppression': <span className="text-red-500">×</span>
  };
  
  return icons[actionType] || null;
};

export const HistoryList: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
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
            <TableHead className="w-[180px]">Date</TableHead>
            <TableHead className="w-[150px]">Action</TableHead>
            <TableHead>Document</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {format(new Date(item.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getActionIcon(item.action_type)}
                  <span>{translateActionType(item.action_type)}</span>
                </div>
              </TableCell>
              <TableCell>{item.document_name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
