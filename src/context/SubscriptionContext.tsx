
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Subscription } from '../components/types';
import { useToast } from '@/components/ui/use-toast';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  startCheckout: () => Promise<void>;
  manageSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  refreshSubscription: async () => {},
  startCheckout: async () => {},
  manageSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Vérifier l'état de l'abonnement
  const checkSubscription = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message);
      }

      setSubscription(data as Subscription);
    } catch (error: any) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error);
      toast({
        title: "Erreur",
        description: `Impossible de vérifier votre abonnement: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Démarrer la session de checkout Stripe
  const startCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw new Error(error.message);
      if (!data.url) throw new Error("URL de paiement non disponible");
      
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Erreur lors de la création du checkout:', error);
      toast({
        title: "Erreur",
        description: `Impossible de démarrer le processus de paiement: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Gérer l'abonnement via le portail client Stripe
  const manageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw new Error(error.message);
      if (!data.url) throw new Error("URL du portail client non disponible");
      
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Erreur lors de l\'accès au portail client:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'accéder au portail client: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Vérifier l'abonnement au montage et lors des changements d'authentification
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await checkSubscription();
      } else {
        setSubscription(null);
        setLoading(false);
      }
    };

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await checkAuth();
    });

    checkAuth();

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        refreshSubscription: checkSubscription,
        startCheckout,
        manageSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
