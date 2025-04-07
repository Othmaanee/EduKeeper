
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté et rediriger en fonction du rôle
  useEffect(() => {
    const redirectBasedOnRole = async () => {
      try {
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
          navigate('/login');
          return;
        }
        
        // Rediriger en fonction du rôle
        if (userData.role === 'enseignant') {
          navigate('/dashboard-enseignant');
        } else {
          navigate('/accueil');
        }
      } catch (error) {
        console.error("Erreur lors de la redirection:", error);
        navigate('/login');
      }
    };

    redirectBasedOnRole();
  }, [navigate]);
  
  // Afficher un spinner de chargement pendant la vérification
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Chargement...</span>
    </div>
  );
};

export default Index;
