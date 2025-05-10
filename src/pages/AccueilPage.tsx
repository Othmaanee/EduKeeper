
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AccueilPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Rediriger vers la page de connexion si pas de session
          navigate('/login');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        navigate('/login');
      }
    };

    checkUserAccess();
  }, [navigate]);
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement...</span>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default AccueilPage;
