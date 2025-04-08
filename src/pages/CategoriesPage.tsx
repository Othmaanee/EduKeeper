
import { Layout } from '../components/Layout';
import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CategoryGrid } from '@/components/CategoryGrid';

const CategoriesPage = () => {
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAuthentication = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }
        
        // L'utilisateur est authentifié, peu importe son rôle
        // Pas besoin de vérifier le rôle spécifiquement
      } catch (error) {
        console.error("Erreur:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkUserAuthentication();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (accessError) {
    return (
      <Layout>
        <div className="container py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Accès non autorisé</AlertTitle>
            <AlertDescription>{accessError}</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Catégories</h1>
        <p className="text-muted-foreground mb-6">
          Explorez les catégories de documents
        </p>
        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <CategoryGrid />
        </Suspense>
      </div>
    </Layout>
  );
};

export default CategoriesPage;
