
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '../context/SubscriptionContext';

const SuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  
  useEffect(() => {
    const updateSubscription = async () => {
      // Mettre à jour l'état de l'abonnement après un paiement réussi
      await refreshSubscription();
    };
    
    updateSubscription();
  }, [refreshSubscription]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight">Paiement réussi</h1>
          
          <p className="text-muted-foreground">
            Merci pour votre abonnement à EduKeeper ! Votre compte a été activé avec succès.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            className="w-full" 
            onClick={() => navigate('/accueil')}
          >
            Accéder à mon espace
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/subscription')}
          >
            Voir les détails de mon abonnement
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
