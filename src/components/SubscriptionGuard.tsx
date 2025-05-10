
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Uniquement rediriger si le chargement est terminé et qu'il n'y a pas d'abonnement
    if (!loading) {
      if (subscription === null) {
        navigate('/login');
      } else if (!subscription?.subscribed) {
        navigate('/subscription');
      }
    }
  }, [subscription, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  // Uniquement afficher le contenu si l'abonnement est actif
  if (!subscription?.subscribed) {
    return null;
  }

  return <>{children}</>;
};
