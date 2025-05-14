
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erreur de connexion:', error.message);
        toast({
          title: 'Erreur de connexion',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      console.log("Connexion réussie, session:", !!data.session);
      
      // Assurez-vous que la session est bien stockée
      if (data.session) {
        // La session sera automatiquement stockée par supabase-js
        console.log("Session token:", data.session.access_token.substring(0, 10) + '...');
        
        // Rediriger vers la page d'accueil après la connexion réussie
        navigate('/');
        
        toast({
          title: 'Connexion réussie',
          description: 'Bienvenue!',
          variant: 'default',
        });
      }
    } catch (err: any) {
      console.error('Exception lors de la connexion:', err.message);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la connexion',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">EduKeeper</h1>
          <p className="mt-2 text-muted-foreground">Connectez-vous pour continuer</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
