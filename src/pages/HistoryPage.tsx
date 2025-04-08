
import { Layout } from '@/components/Layout';
import { HistoryList } from '@/components/HistoryList';
import { History, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const HistoryPage = () => {
  // Ajout d'un queryClient pour rafraîchir les données à l'ouverture de la page
  const queryClient = useQueryClient();
  
  // Rafraîchir les données d'historique à chaque visite de la page
  useEffect(() => {
    // Invalider le cache pour forcer un rechargement des données
    queryClient.invalidateQueries({ queryKey: ['history'] });
  }, [queryClient]);
  
  return (
    <Layout>
      <div className="container py-6 animate-fade-in">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/" className="flex items-center text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à l'accueil
          </Link>
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle>Mon Historique</CardTitle>
            </div>
            <CardDescription>
              Consultez l'historique de vos actions récentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HistoryList />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HistoryPage;
