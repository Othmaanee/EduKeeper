import { Layout } from '../components/Layout';
import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { CategoryGrid } from '@/components/CategoryGrid';

const CategoriesPage = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error("Erreur lors de la vérification du rôle:", error);
          navigate('/');
          return;
        }
        
        setUserRole(userData.role);
        
        if (userData.role === 'enseignant') {
          setAccessError("Cette page est réservée aux élèves. Vous allez être redirigé vers votre tableau de bord.");
          setTimeout(() => {
            navigate('/dashboard-enseignant');
          }, 3000);
        }
      } catch (error) {
        console.error("Erreur:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
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
        <h1 className="text-2xl font-bold mb-2">Mes Catégories</h1>
        <p className="text-muted-foreground mb-6">
          Explorez vos catégories de documents
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
