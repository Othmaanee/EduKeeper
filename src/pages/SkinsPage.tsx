
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SkinsList } from '@/components/Skins/SkinsList';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const SkinsPage = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirection vers la page de connexion si l'utilisateur n'est pas connecté
          navigate('/login');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Vérification de l'authentification...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirection gérée dans l'effet
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🎨 Mes Skins</h1>
        <SkinsList />
      </div>
    </Layout>
  );
};

export default SkinsPage;
