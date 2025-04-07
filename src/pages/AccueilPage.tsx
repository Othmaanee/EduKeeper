
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AccueilPage = () => {
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté et a le bon rôle
  useEffect(() => {
    const checkUserAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Rediriger vers la page de connexion si pas de session
        navigate('/login');
        return;
      }

      // Vérifier le rôle de l'utilisateur
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (error) {
        console.error("Erreur lors de la vérification du rôle:", error);
        navigate('/login');
        return;
      }
      
      // Si enseignant, rediriger vers le dashboard enseignant
      if (data.role === 'enseignant') {
        navigate('/dashboard-enseignant');
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
