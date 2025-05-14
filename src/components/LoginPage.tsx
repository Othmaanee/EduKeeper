
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { XCircle, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // S'assurer que la session est stockée correctement
        const session = data.session;
        if (!session) throw new Error("Session d'authentification invalide");
        
        console.log("Connexion réussie, session:", session);
        console.log("Access token:", session.access_token);
        console.log("Refresh token:", session.refresh_token);

        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
          variant: "default",
        });

        navigate('/accueil');
      } else {
        // Register
        if (!email || !password || !firstName || !lastName) {
          throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        // Signup with meta data
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nom: lastName,
              prenom: firstName,
              classe: classLevel || 'user', // Default value if not provided
              date_naissance: birthDate || null, // Default value if not provided
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
          variant: "default",
        });

        // Switch to login view after successful registration
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Erreur d\'authentification:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Connexion" : "Inscription"}</CardTitle>
            <CardDescription>
              {isLogin 
                ? "Accédez à votre compte pour utiliser l'application." 
                : "Créez un compte pour commencer à utiliser l'application."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        placeholder="Prénom"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        placeholder="Nom"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="classLevel">Classe</Label>
                      <Input
                        id="classLevel"
                        placeholder="Ex: Terminale S"
                        value={classLevel}
                        onChange={(e) => setClassLevel(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Date de naissance</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button 
                type="submit" 
                className="w-full mb-4"
                disabled={loading}
              >
                {loading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsLogin(!isLogin)}
                className="w-full"
              >
                {isLogin ? "Créer un compte" : "Déjà un compte ? Se connecter"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {/* Indications de sécurité */}
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium">Pour votre sécurité :</h3>
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Utilisez un mot de passe unique</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Minimum 8 caractères avec lettres et chiffres</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span>Évitez les informations personnelles facilement devinables</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
