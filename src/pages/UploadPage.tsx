
import { Layout } from '../components/Layout';
import { Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const UploadPage = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategoryId = searchParams.get('category_id');

  useEffect(() => {
    const checkUserAuthentication = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }
        
        // L'utilisateur est authentifié, peu importe son rôle
      } catch (error) {
        console.error("Erreur:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkUserAuthentication();
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

  // Pass the initialCategoryId to the UploadModal component via window
  if (initialCategoryId) {
    window.initialUploadCategoryId = initialCategoryId;
  } else {
    // Clear any previously set value
    window.initialUploadCategoryId = null;
  }

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Importer un document</h1>
        <p className="text-muted-foreground mb-6">
          Importez vos documents pour les partager ou les analyser
        </p>
        
        {/* The actual UploadModal component is a read-only component, 
            so we're using a workaround with window object */}
        <div id="upload-container"></div>
      </div>
    </Layout>
  );
};

// Add type declaration for window object
declare global {
  interface Window {
    initialUploadCategoryId: string | null;
  }
}

export default UploadPage;
