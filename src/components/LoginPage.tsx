import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signInMethod, setSignInMethod] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [success, setSuccess] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (type: 'sign_in' | 'sign_up') => {
    try {
      setLoading(true);
      setSuccess(null);

      if (!email || !password) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs.",
          variant: "destructive",
        });
        return;
      }

      if (type === 'sign_in') {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setSuccess(false);
          toast({
            title: "Erreur de connexion",
            description: signInError.message,
            variant: "destructive",
          });
          return;
        }

        if (signInData.user) {
          setSuccess(true);
          toast({
            title: "Connexion réussie",
            description: "Vous êtes connecté avec succès.",
          });
          navigate('/accueil');
        }
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              email: email,
            },
          },
        });

        if (signUpError) {
          setSuccess(false);
          toast({
            title: "Erreur d'inscription",
            description: signUpError.message,
            variant: "destructive",
          });
          return;
        }

        if (signUpData.user) {
          setSuccess(true);
          toast({
            title: "Inscription réussie",
            description: "Veuillez vérifier votre email pour confirmer votre inscription.",
          });
        }
      }
    } catch (error: any) {
      setSuccess(false);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-12">
      <Card className="w-full max-w-md space-y-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Authentification</CardTitle>
          <CardDescription>Entrez votre email et mot de passe pour vous connecter ou créer un compte.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Tabs defaultValue="sign_in" className="w-full">
            <TabsList>
              <TabsTrigger value="sign_in" onClick={() => setSignInMethod('sign_in')}>Se connecter</TabsTrigger>
              <TabsTrigger value="sign_up" onClick={() => setSignInMethod('sign_up')}>S'inscrire</TabsTrigger>
            </TabsList>
            <TabsContent value="sign_in">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSignIn('sign_in')} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </CardFooter>
            </TabsContent>
            <TabsContent value="sign_up">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSignIn('sign_up')} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    'Créer un compte'
                  )}
                </Button>
              </CardFooter>
            </TabsContent>
          </Tabs>
        </CardContent>
        {success !== null && (
          <div className={cn("p-3 rounded-md flex items-center", success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
            {success ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {signInMethod === 'sign_in' ? "Connexion réussie !" : "Inscription réussie ! Veuillez vérifier votre email."}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                {signInMethod === 'sign_in' ? "Erreur de connexion." : "Erreur d'inscription."}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default LoginPage;
