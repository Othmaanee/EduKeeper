
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AccueilPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Vérifier si l'utilisateur est connecté et a le bon rôle
  useEffect(() => {
    const checkUserAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Rediriger vers la page de connexion si pas de session
        navigate('/login');
        return;
      }

      // Enregistrer l'ID utilisateur pour l'utiliser dans les demandes d'abonnement
      setUserId(session.user.id);

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
  
  // Fonction pour envoyer un email d'intérêt pour l'abonnement
  const handleSubscriptionInterest = async (message: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://mtbcrbfchoqterxevvft.supabase.co'}/functions/v1/send-subscription-interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10YmNyYmZjaG9xdGVyeGV2dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDUwNzUsImV4cCI6MjA1NzEyMTA3NX0.97PG3U92JkmrsoxmxFNxiFMwxsHc8GnQM8Xpailfhy0'}`,
        },
        body: JSON.stringify({
          userId,
          message
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }

      const data = await response.json();
      console.log('Réponse:', data);
      
      toast({
        title: "Demande envoyée",
        description: "Votre intérêt pour l'abonnement a été enregistré",
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Layout>
      <Dashboard onSubscribeInterest={handleSubscriptionInterest} />
    </Layout>
  );
};

export default AccueilPage;
