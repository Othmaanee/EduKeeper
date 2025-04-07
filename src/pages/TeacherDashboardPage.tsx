
import { Layout } from '../components/Layout';
import { TeacherDashboard } from '../components/TeacherDashboard';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const TeacherDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const navigate = useNavigate();

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
        
        // Rediriger vers la page d'accueil si le rôle n'est pas "enseignant"
        if (userData.role !== 'enseignant') {
          setAccessError("Cette page est réservée aux enseignants. Vous allez être redirigé vers votre espace élève.");
          setTimeout(() => {
            navigate('/accueil');
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

  // Afficher un message d'erreur si l'accès est non autorisé
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
      <TeacherDashboard />
    </Layout>
  );
};

export default TeacherDashboardPage;
