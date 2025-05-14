
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { CalendarIcon, AlertCircle, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Classes disponibles
const CLASSES_DISPONIBLES = [
  "6e", "5e", "4e", "3e", 
  "2nde", "1ere", "Terminale",
  "Supérieur", "Enseignant", "Autre"
];

const LoginPage = () => {
  // États pour la connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // États additionnels pour l'inscription
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [classe, setClasse] = useState('');
  const [dateNaissance, setDateNaissance] = useState<Date | undefined>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };

    checkSession();

    // Configurer l'écouteur d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log("Utilisateur connecté:", session.user.email);
          navigate('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Validation des champs
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (activeTab === 'signup') {
      if (!prenom.trim()) {
        newErrors.prenom = "Veuillez entrer votre prénom";
      }
      
      if (!nom.trim()) {
        newErrors.nom = "Veuillez entrer votre nom";
      }
      
      if (!classe) {
        newErrors.classe = "Veuillez sélectionner votre classe";
      }
      
      if (!dateNaissance) {
        newErrors.dateNaissance = "Veuillez sélectionner votre date de naissance";
      }
    }
    
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }
    
    if (!password.trim()) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erreur de connexion:', error.message);
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.session) {
        console.log("Connexion réussie:", data.session);
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté",
        });
      }
    } catch (error: any) {
      console.error('Erreur:', error.message);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      // Formater la date de naissance au format ISO
      const formattedDate = dateNaissance ? dateNaissance.toISOString().split('T')[0] : '';
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Ajouter les métadonnées nécessaires pour le trigger handle_new_user
          data: {
            nom: nom,
            prenom: prenom,
            classe: classe,
            date_naissance: formattedDate,
          }
        }
      });

      if (error) {
        console.error('Erreur d\'inscription:', error.message);
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log("Inscription réussie:", data);
        toast({
          title: "Inscription réussie",
          description: "Veuillez confirmer votre email pour vous connecter",
        });
        setActiveTab('login');
      }
    } catch (error: any) {
      console.error('Erreur:', error.message);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">EduKeeper</CardTitle>
          <CardDescription>Connectez-vous pour accéder à votre espace</CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votreemail@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={cn(errors.email && "border-red-500")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={cn(errors.password && "border-red-500")}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votreemail@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={cn(errors.email && "border-red-500")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
                
                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={cn(errors.password && "border-red-500")}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.password}
                    </p>
                  )}
                  
                  {/* Les conseils de sécurité sont conservés dans le code mais ne sont pas affichés */}
                  {/* 
                  <div className="mt-2 text-sm space-y-1">
                    <p className="text-muted-foreground mb-1">Pour votre sécurité :</p>
                    <div className={cn("flex items-center", password.length >= 8 ? "text-green-600" : "text-gray-400")}>
                      {password.length >= 8 ? <Check size={16} className="mr-1" /> : <Info size={16} className="mr-1" />}
                      <span>Minimum 8 caractères</span>
                    </div>
                    <div className={cn("flex items-center", /[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-green-600" : "text-gray-400")}>
                      {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <Check size={16} className="mr-1" /> : <Info size={16} className="mr-1" />}
                      <span>Mélanger lettres majuscules et minuscules</span>
                    </div>
                    <div className={cn("flex items-center", /\d/.test(password) ? "text-green-600" : "text-gray-400")}>
                      {/\d/.test(password) ? <Check size={16} className="mr-1" /> : <Info size={16} className="mr-1" />}
                      <span>Inclure des chiffres</span>
                    </div>
                  </div>
                  */}
                </div>
                
                {/* Prénom et Nom sur la même ligne */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Prénom */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-prenom">Prénom</Label>
                    <Input
                      id="signup-prenom"
                      type="text"
                      placeholder="Prénom"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      required
                      className={cn(errors.prenom && "border-red-500")}
                    />
                    {errors.prenom && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.prenom}
                      </p>
                    )}
                  </div>
                  
                  {/* Nom */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-nom">Nom</Label>
                    <Input
                      id="signup-nom"
                      type="text"
                      placeholder="Nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      className={cn(errors.nom && "border-red-500")}
                    />
                    {errors.nom && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.nom}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Classe */}
                <div className="space-y-2">
                  <Label htmlFor="signup-classe">Classe</Label>
                  <Select 
                    value={classe} 
                    onValueChange={setClasse}
                  >
                    <SelectTrigger id="signup-classe" className={cn(errors.classe && "border-red-500")}>
                      <SelectValue placeholder="Sélectionnez votre classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES_DISPONIBLES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.classe && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.classe}
                    </p>
                  )}
                </div>
                
                {/* Date de naissance */}
                <div className="space-y-2">
                  <Label htmlFor="signup-date">Date de naissance</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="signup-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateNaissance && "text-muted-foreground",
                          errors.dateNaissance && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateNaissance ? (
                          format(dateNaissance, 'P', { locale: fr })
                        ) : (
                          <span>Sélectionnez votre date de naissance</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateNaissance}
                        onSelect={setDateNaissance}
                        initialFocus
                        locale={fr}
                        captionLayout="dropdown-buttons"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateNaissance && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.dateNaissance}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
