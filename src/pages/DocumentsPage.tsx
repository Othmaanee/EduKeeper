
import { Layout } from '../components/Layout';
import { DocumentGrid } from '../components/DocumentGrid';
import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const DocumentsPage = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get categoryId from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const categoryId = searchParams.get('category_id');

  // Vérifier le rôle de l'utilisateur au chargement de la page
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Rediriger vers la page de connexion si pas de session
          navigate('/login');
          return;
        }

        // Récupérer le rôle de l'utilisateur depuis la table users
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
        console.log("User role in DocumentsPage:", userData.role);
      } catch (error) {
        console.error("Erreur:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [navigate]);

  // Afficher un écran de chargement pendant la vérification
  if (loading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // N'afficher le contenu que si l'utilisateur a un rôle valide
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Mes Documents</h1>
        <p className="text-muted-foreground mb-6">
          Consultez vos documents personnels et les documents partagés par vos enseignants
        </p>
        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <DocumentGrid initialCategoryId={categoryId} />
        </Suspense>
      </div>
    </Layout>
  );
};

export default DocumentsPage;
