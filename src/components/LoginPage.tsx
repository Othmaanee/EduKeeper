
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useXPStore } from "@/store/xpStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchUserXP } = useXPStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [registrationPassword, setRegistrationPassword] = useState("");
  const [registrationNom, setRegistrationNom] = useState("");
  const [registrationPrenom, setRegistrationPrenom] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Utilisateur déjà connecté, redirection vers l'accueil");
        navigate("/");
      }
    };
    
    checkSession();
    
    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Événement d'authentification:", event);
      if (event === 'SIGNED_IN' && session) {
        console.log("Utilisateur connecté, redirection vers l'accueil");
        // Mettre à jour le store XP après connexion
        fetchUserXP();
        navigate("/");
      } else if (event === 'SIGNED_OUT') {
        console.log("Utilisateur déconnecté");
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, fetchUserXP]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log("Connexion réussie:", data);
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
        className: "bg-green-500 text-white",
      });
      
      // Mettre à jour les données XP
      fetchUserXP();
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registrationEmail,
        password: registrationPassword,
        options: {
          data: {
            nom: registrationNom,
            prenom: registrationPrenom,
            role: "eleve", // Rôle par défaut
          }
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès.",
        className: "bg-green-500 text-white",
      });
      
      // Redirection automatique après inscription réussie
      if (data.session) {
        // Mettre à jour les données XP
        fetchUserXP();
        navigate("/");
      } else {
        setActiveTab("login");
      }
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">EduKeeper</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte ou créez-en un nouveau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
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
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                      Mot de passe oublié?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      placeholder="Dupont"
                      value={registrationNom}
                      onChange={(e) => setRegistrationNom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      placeholder="Jean"
                      value={registrationPrenom}
                      onChange={(e) => setRegistrationPrenom(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationEmail">Email</Label>
                  <Input
                    id="registrationEmail"
                    type="email"
                    placeholder="votre@email.com"
                    value={registrationEmail}
                    onChange={(e) => setRegistrationEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationPassword">Mot de passe</Label>
                  <Input
                    id="registrationPassword"
                    type="password"
                    placeholder="••••••••"
                    value={registrationPassword}
                    onChange={(e) => setRegistrationPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-600">
          En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </CardFooter>
      </Card>
    </div>
  );
}
