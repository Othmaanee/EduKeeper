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
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        redirectBasedOnRole(data.session.user.id);
      } else {
        setAuthChecked(true);
      }
    };
    
    checkSession();
  }, [navigate]);

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching user role:", error);
        navigate('/', { replace: true });
        return;
      }
      
      if (data && data.role === 'enseignant') {
        navigate('/dashboard-enseignant', { replace: true });
      } else {
        navigate('/accueil', { replace: true });
      }
    } catch (error) {
      console.error("Error during role-based redirection:", error);
      navigate('/', { replace: true });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        await redirectBasedOnRole(data.user.id);
      }
      
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter. Veuillez vérifier vos identifiants.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const isClasseRequired = () => {
    return role === 'eleve';
  };

  const validateForm = () => {
    setValidationError('');

    const trimmedEmail = email.trim();
    const trimmedNom = nom.trim();
    const trimmedPrenom = prenom.trim();
    const trimmedClasse = classe.trim();
    
    if (!trimmedEmail || !password || !trimmedNom || !trimmedPrenom || !dateNaissance) {
      setValidationError("Veuillez remplir tous les champs obligatoires.");
      return false;
    }

    if (!role) {
      setValidationError("Veuillez sélectionner votre rôle pour continuer.");
      return false;
    }

    if (isClasseRequired() && !trimmedClasse) {
      setValidationError("La classe est obligatoire pour les élèves.");
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedNom = nom.trim();
    const trimmedPrenom = prenom.trim();
    const trimmedClasse = classe.trim();

    try {
      const userRole = role || 'user';
      
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            nom: trimmedNom,
            prenom: trimmedPrenom,
            date_naissance: dateNaissance,
            classe: isClasseRequired() ? trimmedClasse : null,
            role: userRole
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "Inscription réussie",
        description: "Compte créé avec succès, veuillez vérifier votre email.",
      });

      setEmail('');
      setPassword('');
      setNom('');
      setPrenom('');
      setDateNaissance('');
      setClasse('');
      setRole('');
      setValidationError('');
      
      const loginTabButton = document.querySelector('[data-state="inactive"][value="login"]');
      if (loginTabButton instanceof HTMLElement) {
        loginTabButton.click();
      }
      
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
                {validationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {validationError}
                  </div>
                )}
                
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
                  <Label htmlFor="role">Vous êtes <span className="text-red-500">*</span></Label>
                  <Select 
                    value={role} 
                    onValueChange={setRole}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez votre profil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eleve">Élève</SelectItem>
                      <SelectItem value="enseignant">Enseignant</SelectItem>
                    </SelectContent>
                  </Select>
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
