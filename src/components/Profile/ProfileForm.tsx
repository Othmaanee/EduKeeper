
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Save, GraduationCap, Check, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  const [dateNaissance, setDateNaissance] = useState("");
  
  // État pour les crédits
  const [credits, setCredits] = useState(CREDITS_MENSUELS);
  const [creditsUtilises, setCreditsUtilises] = useState(0);
  const [dateRenouvellement, setDateRenouvellement] = useState<string | null>(null);
  
  // États UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        
        // Conversion et formatage de la date de naissance
        if (data.date_naissance) {
          const dateParts = data.date_naissance.split('T')[0];
          setDateNaissance(dateParts);
        }
        
        // Vérifier si l'utilisateur est admin
        setIsAdmin(data.role === 'admin');
        
        // Calculer les crédits utilisés (nombre d'actions d'IA dans l'historique du mois courant)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Récupérer le nombre d'actions IA dans l'historique du mois
        const { data: historyData, count, error: historyError } = await supabase
          .from('history')
          .select('*', { count: 'exact' })
          .eq('user_id', session.user.id)
          .gte('created_at', firstDayOfMonth.toISOString())
          .in('action_type', ['generate_summary', 'generate_control', 'generate_exercises']);
          
        if (historyError) {
          console.error("Erreur lors de la récupération de l'historique:", historyError);
        } else {
          // Calculer le nombre de crédits utilisés
          setCreditsUtilises(count || 0);
          
          // Calculer la date de renouvellement (1er du mois prochain)
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          setDateRenouvellement(format(nextMonth, 'dd/MM/yyyy'));
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors du chargement de votre profil.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast]);

  // Enregistrer les modifications du profil
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Pas de session",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive",
        });
        return;
      }
      
      // Mettre à jour les informations du profil
      const { error } = await supabase
        .from('users')
        .update({
          prenom,
          nom,
          classe,
          date_naissance: dateNaissance
        })
        .eq('id', session.user.id);
      
      if (error) {
        console.error("Erreur lors de la mise à jour du profil:", error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour votre profil.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour de votre profil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser les crédits (admin seulement)
  const handleResetCredits = async () => {
    // Cette fonction est disponible uniquement pour les administrateurs
    if (!isAdmin) return;
    
    try {
      setSaving(true);
      
      // Supprimer l'historique des actions IA du mois en cours
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('user_id', session.user.id)
        .gte('created_at', firstDayOfMonth.toISOString())
        .in('action_type', ['generate_summary', 'generate_control', 'generate_exercises']);
      
      if (error) {
        console.error("Erreur lors de la réinitialisation des crédits:", error);
        toast({
          title: "Erreur",
          description: "Impossible de réinitialiser vos crédits.",
          variant: "destructive",
        });
        return;
      }
      
      // Mettre à jour l'affichage
      setCreditsUtilises(0);
      
      toast({
        title: "Crédits réinitialisés",
        description: "Vos crédits ont été réinitialisés avec succès.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la réinitialisation de vos crédits.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-2">Chargement de votre profil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Modifiez vos informations personnelles ci-dessous.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email (lecture seule) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex">
              <Input 
                id="email"
                value={email}
                readOnly
                className="bg-muted"
              />
              <div className="ml-2 flex items-center text-muted-foreground">
                <Lock className="h-4 w-4 mr-1" />
                <span className="text-xs">Lecture seule</span>
              </div>
            </div>
          </div>
          
          {/* Prénom */}
          <div className="space-y-2">
            <Label htmlFor="prenom">Prénom</Label>
            <Input 
              id="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Votre prénom"
            />
          </div>
          
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input 
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          
          {/* Classe */}
          <div className="space-y-2">
            <Label htmlFor="classe">Classe</Label>
            <Select value={classe} onValueChange={setClasse}>
              <SelectTrigger>
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
          </div>

          {/* Date de naissance */}
          <div className="space-y-2">
            <Label htmlFor="dateNaissance">Date de naissance</Label>
            <div className="flex">
              <Input 
                id="dateNaissance"
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
              />
              <div className="ml-2 flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Section Crédits IA */}
      <Card>
        <CardHeader>
          <CardTitle>Crédits IA</CardTitle>
          <CardDescription>
            Vos crédits mensuels pour les fonctionnalités d'intelligence artificielle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Crédits utilisés ce mois-ci</span>
              <Badge variant={creditsUtilises >= CREDITS_MENSUELS ? "destructive" : "outline"}>
                {creditsUtilises} / {CREDITS_MENSUELS}
              </Badge>
            </div>
            <Progress 
              value={(creditsUtilises / CREDITS_MENSUELS) * 100} 
              className="h-2" 
            />
            <p className="text-sm text-muted-foreground">
              Vous avez utilisé {creditsUtilises} crédits sur {CREDITS_MENSUELS} ce mois-ci.
            </p>
            {dateRenouvellement && (
              <p className="text-sm text-muted-foreground mt-2">
                Prochain renouvellement des crédits le : <span className="font-medium">{dateRenouvellement}</span>
              </p>
            )}
          </div>
        </CardContent>
        {isAdmin && (
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleResetCredits}
              disabled={saving || creditsUtilises === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Réinitialiser les crédits (Admin)
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
