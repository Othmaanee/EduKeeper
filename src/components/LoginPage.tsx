
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [classe, setClasse] = useState('');
  const [role, setRole] = useState('eleve');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/', { replace: true });
      }
      setAuthChecked(true);
    };
    
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      navigate('/', { replace: true });
      
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter. Veuillez vérifier vos identifiants.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Déterminer si la classe est requise selon le rôle
  const isClasseRequired = () => {
    return role === 'eleve';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation des champs
    const trimmedEmail = email.trim();
    const trimmedNom = nom.trim();
    const trimmedPrenom = prenom.trim();
    const trimmedClasse = classe.trim();
    
    // Vérifications de base
    if (!trimmedEmail || !password || !trimmedNom || !trimmedPrenom || !dateNaissance) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Vérification spécifique pour la classe si l'utilisateur est un élève
    if (isClasseRequired() && !trimmedClasse) {
      toast({
        title: "Erreur de validation",
        description: "La classe est obligatoire pour les élèves.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Créer l'utilisateur avec Supabase Auth
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            nom: trimmedNom,
            prenom: trimmedPrenom,
            date_naissance: dateNaissance,
            classe: isClasseRequired() ? trimmedClasse : null,
            role: 'user' // rôle par défaut dans la base de données
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "Inscription réussie",
        description: "Compte créé avec succès, veuillez vérifier votre email.",
      });

      // Réinitialiser les champs du formulaire
      setEmail('');
      setPassword('');
      setNom('');
      setPrenom('');
      setDateNaissance('');
      setClasse('');
      setRole('eleve');
      
      // Basculer vers l'onglet de connexion
      document.querySelector('[data-state="inactive"][value="login"]')?.click();
      
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer un compte. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 flex flex-col items-center">
        <BookOpen className="h-12 w-12 text-primary mb-2" />
        <h1 className="text-2xl font-semibold tracking-tight">EduKeeper</h1>
        <p className="text-sm text-muted-foreground mt-1">Votre espace de ressources éducatives</p>
      </div>

      <Card className="w-full max-w-md shadow-sm">
        <Tabs defaultValue="login" className="w-full">
          <CardHeader>
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Inscription</TabsTrigger>
              </TabsList>
            </div>
            <CardDescription className="text-center mt-2">
              Accédez à votre espace personnel ou créez un nouveau compte
            </CardDescription>
          </CardHeader>

          <CardContent>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="votre@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Mot de passe</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    placeholder="6 caractères minimum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input 
                      id="nom" 
                      type="text" 
                      placeholder="Dupont"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input 
                      id="prenom" 
                      type="text" 
                      placeholder="Jean"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-naissance">Date de naissance</Label>
                  <Input 
                    id="date-naissance" 
                    type="date" 
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Vous êtes</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={setRole}
                    className="flex space-x-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="eleve" id="eleve" />
                      <Label htmlFor="eleve">Élève</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="enseignant" id="enseignant" />
                      <Label htmlFor="enseignant">Enseignant</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {isClasseRequired() && (
                  <div className="space-y-2">
                    <Label htmlFor="classe">Classe</Label>
                    <Input 
                      id="classe" 
                      type="text" 
                      placeholder="6ème A"
                      value={classe}
                      onChange={(e) => setClasse(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Création du compte...' : "S'inscrire"}
                </Button>
              </form>
            </TabsContent>
          </CardContent>

          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-xs text-center text-muted-foreground">
              En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </p>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
