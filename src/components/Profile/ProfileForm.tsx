
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Save, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Constantes pour les classes disponibles
const CLASSES_DISPONIBLES = [
  "6e", "5e", "4e", "3e", 
  "2nde", "1ere", "Terminale",
  "Supérieur", "Enseignant", "Autre"
];

// Nombre de crédits mensuels
const CREDITS_MENSUELS = 50;

export function ProfileForm() {
  // État du profil
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [classe, setClasse] = useState("");
  
  // État pour les crédits
  const [credits, setCredits] = useState(CREDITS_MENSUELS);
  const [creditsUtilises, setCreditsUtilises] = useState(0);
  
  // États UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { toast } = useToast();

  // Charger les données de l'utilisateur
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Récupérer la session utilisateur
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Pas de session",
            description: "Veuillez vous connecter pour accéder à votre profil.",
            variant: "destructive",
          });
          return;
        }
        
        // Récupérer les données de l'utilisateur depuis la table users
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Erreur lors de la récupération du profil:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger votre profil.",
            variant: "destructive",
          });
          return;
        }

        // Mise à jour des états avec les données utilisateur
        setProfile(data);
        setEmail(session.user.email || "");
        setPrenom(data.prenom || "");
        setNom(data.nom || "");
        setClasse(data.classe || "");
        
        // Vérifier si l'utilisateur est admin
        setIsAdmin(data.role === "admin" || data.role === "enseignant");
        
        // Simuler un nombre de crédits utilisés (à remplacer par une vraie logique dans une version future)
        // Par exemple, on pourrait compter les actions IA dans la table history
        const actions = await supabase
          .from('history')
          .select('*')
          .eq('user_id', session.user.id)
          .count();
          
        const nbActions = actions.count || 0;
        const creditsConsommes = Math.min(nbActions, CREDITS_MENSUELS);
        
        setCreditsUtilises(creditsConsommes);
        setCredits(CREDITS_MENSUELS - creditsConsommes);
      } catch (error) {
        console.error("Erreur:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement du profil.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      if (!profile) return;
      
      // Mettre à jour le profil utilisateur
      const { error } = await supabase
        .from('users')
        .update({
          prenom: prenom,
          nom: nom,
          classe: classe
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder votre profil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleResetCredits = async () => {
    try {
      setResetting(true);
      
      if (!isAdmin || !profile) return;
      
      // Simuler une réinitialisation des crédits (à implémenter réellement plus tard)
      // Pour l'instant, nous supprimons simplement les entrées d'historique pour réduire le compteur
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('user_id', profile.id);
        
      if (error) throw error;
      
      // Mettre à jour l'interface
      setCreditsUtilises(0);
      setCredits(CREDITS_MENSUELS);
      
      toast({
        title: "Crédits réinitialisés",
        description: "Vous avez à nouveau 50 crédits disponibles.",
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des crédits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser vos crédits.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement de votre profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Gérez les informations de votre profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex">
              <Input
                id="email"
                value={email}
                className="bg-muted"
                disabled
                readOnly
              />
              <Lock className="h-4 w-4 ml-2 self-center text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Votre adresse email ne peut pas être modifiée.</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstname">Prénom</Label>
              <Input
                id="firstname"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <Label htmlFor="lastname">Nom</Label>
              <Input
                id="lastname"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="class">Classe</Label>
            <Select value={classe} onValueChange={setClasse}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre classe" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES_DISPONIBLES.map((classe) => (
                  <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center mt-1">
              <GraduationCap className="h-4 w-4 mr-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Sélectionnez votre niveau scolaire pour des contenus adaptés.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Utilisation des crédits IA</CardTitle>
          <CardDescription>
            Suivez votre consommation des fonctionnalités IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Crédits restants : <Badge variant="outline" className="ml-1 font-mono">{credits}</Badge></span>
              <span>Total : <Badge variant="outline" className="ml-1 font-mono">{CREDITS_MENSUELS}</Badge></span>
            </div>
            <Progress value={(credits / CREDITS_MENSUELS) * 100} className="h-2" />
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              Vous avez utilisé <span className="font-semibold text-primary">{creditsUtilises} crédits</span> sur {CREDITS_MENSUELS} ce mois-ci.
              Ces crédits sont consommés à chaque utilisation des fonctionnalités d'intelligence artificielle (génération de résumés, exercices ou contrôles).
            </p>
          </div>
          
          {isAdmin && (
            <Button 
              variant="outline"
              onClick={handleResetCredits}
              disabled={resetting || creditsUtilises === 0}
              className="w-full"
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser mes crédits
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
