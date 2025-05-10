
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AccueilPage = () => {
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkUserAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Rediriger vers la page de connexion si pas de session
        navigate('/login');
        return;
      }
    };

    checkUserAccess();
  }, [navigate]);
  
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default AccueilPage;
