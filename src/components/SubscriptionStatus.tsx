
import { useSubscription } from '../context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format, formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarClock, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export const SubscriptionStatus = () => {
  const { subscription, loading, startCheckout, manageSubscription } = useSubscription();

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Utilisateur non abonné
  if (!subscription?.subscribed) {
    return (
      <Card className="w-full border-2 border-red-200">
        <CardHeader className="bg-red-50">
          <div className="flex items-center gap-2">
            <XCircle className="text-red-500" />
            <CardTitle className="text-red-700">Abonnement requis</CardTitle>
          </div>
          <CardDescription>
            Vous n'avez pas d'abonnement actif
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          <p className="text-sm">
            EduKeeper nécessite un abonnement pour accéder aux fonctionnalités 
            avancées comme la génération de résumés et l'assistance IA.
          </p>
          <div className="font-medium text-center py-2">
            <p>Abonnement EduKeeper</p>
            <p className="text-2xl font-bold">4,90€ <span className="text-sm font-normal">/mois</span></p>
            <p className="text-xs text-muted-foreground">Sans engagement - Période d'essai de 14 jours incluse</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={startCheckout} className="w-full">
            S'abonner
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Utilisateur en période d'essai
  if (subscription.subscription_tier === 'trial' && subscription.trial_end) {
    const trialEndDate = new Date(subscription.trial_end);
    const now = new Date();
    const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card className="w-full border-2 border-amber-200">
        <CardHeader className="bg-amber-50">
          <div className="flex items-center gap-2">
            <CalendarClock className="text-amber-500" />
            <CardTitle className="text-amber-700">Période d'essai</CardTitle>
          </div>
          <CardDescription>
            Il vous reste {daysLeft} jour{daysLeft > 1 ? 's' : ''} d'essai
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          <p className="text-sm">
            Votre période d'essai se termine le {format(trialEndDate, 'd MMMM yyyy', { locale: fr })}.
            Pour continuer à utiliser EduKeeper après cette date, veuillez prendre un abonnement.
          </p>
          <div className="font-medium text-center py-2">
            <p>Abonnement EduKeeper</p>
            <p className="text-2xl font-bold">4,90€ <span className="text-sm font-normal">/mois</span></p>
            <p className="text-xs text-muted-foreground">Sans engagement</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={startCheckout} className="w-full">
            S'abonner maintenant
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Utilisateur abonné
  return (
    <Card className="w-full border-2 border-green-200">
      <CardHeader className="bg-green-50">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-green-500" />
          <CardTitle className="text-green-700">Abonné</CardTitle>
        </div>
        <CardDescription>
          Votre abonnement est actif
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {subscription.subscription_end && (
          <p className="text-sm">
            Votre abonnement se renouvellera le {format(new Date(subscription.subscription_end), 'd MMMM yyyy', { locale: fr })}.
          </p>
        )}
        <p className="text-sm">
          Vous avez accès à toutes les fonctionnalités d'EduKeeper.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={manageSubscription} variant="outline" className="w-full">
          Gérer mon abonnement
        </Button>
      </CardFooter>
    </Card>
  );
};
