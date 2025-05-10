
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CancelPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight">Paiement annulé</h1>
          
          <p className="text-muted-foreground">
            Votre paiement a été annulé. Aucun montant n'a été prélevé de votre compte.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            className="w-full" 
            onClick={() => navigate('/subscription')}
          >
            Retour à la page d'abonnement
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/accueil')}
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancelPage;
