
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
          // Rediriger vers la landing page si pas de session
          navigate('/landing');
          return;
        }
        
        // Rediriger vers le dashboard élève
        navigate('/accueil');
      } catch (error) {
        console.error("Erreur lors de la redirection:", error);
        navigate('/landing');
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
