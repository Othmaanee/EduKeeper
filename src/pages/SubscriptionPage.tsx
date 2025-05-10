
import { Layout } from '../components/Layout';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { useSubscription } from '../context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw } from 'lucide-react';

const SubscriptionPage = () => {
  const { subscription, loading, refreshSubscription } = useSubscription();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container py-8 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mon abonnement</h1>
            <p className="text-muted-foreground mt-2">
              Gérez votre abonnement EduKeeper
            </p>
          </div>

          <div className="grid gap-6">
            <SubscriptionStatus />
            
            <div className="flex flex-wrap gap-4 justify-between">
              <Button 
                variant="outline" 
                onClick={() => refreshSubscription()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              
              {subscription?.subscribed && (
                <Button 
                  variant="default" 
                  onClick={() => navigate('/accueil')}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Continuer vers l'application
                </Button>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <h2 className="text-xl font-semibold">FAQ Abonnement</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium">Combien coûte l'abonnement ?</h3>
                  <p className="text-sm text-muted-foreground">L'abonnement à EduKeeper coûte 4,90€ par mois sans engagement.</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Y a-t-il une période d'essai ?</h3>
                  <p className="text-sm text-muted-foreground">Oui, vous bénéficiez d'une période d'essai de 14 jours pour tester toutes les fonctionnalités.</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Comment annuler mon abonnement ?</h3>
                  <p className="text-sm text-muted-foreground">Vous pouvez annuler à tout moment en cliquant sur "Gérer mon abonnement".</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Quelles fonctionnalités sont incluses ?</h3>
                  <p className="text-sm text-muted-foreground">L'abonnement donne accès à toutes les fonctionnalités d'EduKeeper, incluant les résumés de documents, l'assistance IA et le stockage de documents.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;
