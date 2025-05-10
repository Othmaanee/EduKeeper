
import React from 'react';
import { FileText, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Document {
  id: string;
  nom: string;
  created_at: string;
  url: string;
  is_shared: boolean;
  category_id: string | null;
  user_id: string | null;
}

interface StatsCardsProps {
  totalDocuments: number;
  sharedDocuments: number;
  latestDocument: Document | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  totalDocuments, 
  sharedDocuments, 
  latestDocument 
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">{totalDocuments}</CardTitle>
          <CardDescription>Documents générés</CardDescription>
        </CardHeader>
        <CardContent>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">{sharedDocuments}</CardTitle>
          <CardDescription>Cours partagés</CardDescription>
        </CardHeader>
        <CardContent>
          <Share2 className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl truncate">
            {latestDocument ? latestDocument.nom : "Aucun document"}
          </CardTitle>
          <CardDescription>Dernier cours généré</CardDescription>
        </CardHeader>
        <CardContent>
          {latestDocument && (
            <p className="text-sm text-muted-foreground">
              {format(new Date(latestDocument.created_at), 'dd MMMM yyyy', { locale: fr })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
