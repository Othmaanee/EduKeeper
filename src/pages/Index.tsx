
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Rediriger vers la page de connexion si pas de session
        navigate('/login');
      }
    };

    checkSession();
  }, [navigate]);
  
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
