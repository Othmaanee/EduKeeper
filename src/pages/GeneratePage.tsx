
import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, School, FileCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GeneratePage = () => {
  const [sujet, setSujet] = useState("");
  const [classe, setClasse] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [difficulte, setDifficulte] = useState("classique");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const { toast } = useToast();

  // Listes pour les sélecteurs
  const classeOptions = [
    "6ème", "5ème", "4ème", "3ème", 
    "Seconde", "Première", "Terminale"
  ];
  
  const specialiteOptions = [
    "Mathématiques",
    "Physique-Chimie",
    "SVT",
    "Histoire-Géographie",
    "Français",
    "Anglais",
    "SES",
    "NSI",
    "Philosophie",
    "Arts"
  ];

  // Fonction pour générer le contrôle
  const handleGenerateEvaluation = async () => {
    if (!sujet.trim()) {
      toast({
        title: "Champ obligatoire",
        description: "Veuillez saisir un sujet de cours",
        variant: "destructive",
      });
      return;
    }

    if (!classe) {
      toast({
        title: "Champ obligatoire",
        description: "Veuillez sélectionner une classe",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setEvaluation(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      // Appel à la fonction Edge pour générer le contrôle
      const { data, error } = await supabase.functions.invoke("generate-evaluation", {
        body: {
          sujet,
          classe,
          specialite,
          difficulte
        }
      });

      if (error) {
        console.error("Erreur lors de la génération du contrôle:", error);
        toast({
          title: "Erreur",
          description: "Impossible de générer le contrôle. Veuillez réessayer.",
          variant: "destructive",
        });
        return;
      }

      if (data?.evaluation) {
        setEvaluation(data.evaluation);
        
        // Enregistrer dans l'historique si l'utilisateur est connecté
        if (session?.user) {
          await supabase
            .from('history')
            .insert({
              user_id: session.user.id,
              action_type: 'génération',
              document_name: `Contrôle: ${sujet}`,
            });
        }
      } else {
        toast({
          title: "Erreur",
          description: "Le format de la réponse est incorrect. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la génération du contrôle:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour obtenir ou créer la catégorie "Mes contrôles"
  const getOrCreateControlCategory = async (userId) => {
    try {
      // Vérifier si la catégorie existe déjà
      const { data: existingCategories, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('nom', 'Mes contrôles')
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      // Si la catégorie existe, renvoyer son ID
      if (existingCategories && existingCategories.length > 0) {
        return existingCategories[0].id;
      }
      
      // Sinon, créer la catégorie
      const { data: newCategory, error: insertError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          nom: 'Mes contrôles'
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      return newCategory.id;
    } catch (error) {
      console.error("Erreur lors de la création/récupération de la catégorie:", error);
      throw error;
    }
  };

  // Fonction pour sauvegarder le contrôle généré
  const handleSaveEvaluation = async () => {
    if (!evaluation) return;

    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Non connecté",
          description: "Veuillez vous connecter pour enregistrer ce contrôle",
          variant: "destructive",
        });
        return;
      }
      
      const userId = session.user.id;
      
      // Obtenir ou créer la catégorie "Mes contrôles"
      const categoryId = await getOrCreateControlCategory(userId);
      
      // Créer un nom pour le document
      const documentName = `Contrôle - ${sujet} (${classe})`;
      
      // Sauvegarder dans les documents
      const { data, error } = await supabase
        .from('documents')
        .insert({
          nom: documentName,
          content: evaluation,
          user_id: userId,
          is_shared: false,
          url: null,
          category_id: categoryId,
          summary: `Contrôle d'entraînement sur ${sujet} pour le niveau ${classe}${specialite && specialite !== 'aucune' ? `, spécialité ${specialite}` : ''}.`
        })
        .select()
        .single();
        
      if (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        throw error;
      }
      
      // Ajouter à l'historique
      await supabase
        .from('history')
        .insert({
          user_id: userId,
          action_type: 'sauvegarde',
          document_name: documentName
        });
      
      toast({
        title: "Succès",
        description: "Le contrôle a été enregistré dans vos documents",
      });
      
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du contrôle:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le contrôle. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 relative">
        <h1 className="text-2xl font-bold mb-2">Générer un contrôle</h1>
        <p className="text-muted-foreground mb-6">
          Créez des contrôles personnalisés pour vous entraîner avant les examens.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulaire de génération */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du contrôle</CardTitle>
              <CardDescription>
                Configurez le contrôle selon vos besoins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Sujet du cours *</Label>
                <Input 
                  id="subject" 
                  placeholder="Ex: La Seconde Guerre Mondiale" 
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="class">Classe *</Label>
                <Select 
                  value={classe} 
                  onValueChange={setClasse}
                  disabled={isLoading}
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classeOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="speciality">Spécialité (facultatif)</Label>
                <Select 
                  value={specialite} 
                  onValueChange={setSpecialite}
                  disabled={isLoading}
                >
                  <SelectTrigger id="speciality">
                    <SelectValue placeholder="Sélectionner une spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Correction ici: Remplacer la valeur vide par une chaîne non vide "aucune" */}
                    <SelectItem key="aucune" value="aucune">Aucune</SelectItem>
                    {specialiteOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Niveau de difficulté</Label>
                <Select 
                  value={difficulte} 
                  onValueChange={setDifficulte}
                  disabled={isLoading}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bases">Bases (débutant)</SelectItem>
                    <SelectItem value="classique">Classique (intermédiaire)</SelectItem>
                    <SelectItem value="très complet">Très complet (avancé)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateEvaluation}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <School className="mr-2 h-4 w-4" />
                    Générer le contrôle
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Résultat généré */}
          <Card className={evaluation ? "" : "opacity-60"}>
            <CardHeader>
              <CardTitle>Contrôle généré</CardTitle>
              <CardDescription>
                {evaluation 
                  ? "Voici votre contrôle d'entraînement personnalisé" 
                  : "Le contrôle généré apparaîtra ici"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p className="text-muted-foreground text-center">
                    Génération de votre contrôle en cours...
                    <br />
                    Cela peut prendre quelques instants
                  </p>
                </div>
              ) : evaluation ? (
                <div className="max-h-[500px] overflow-y-auto border rounded-md p-4 bg-muted/30 whitespace-pre-wrap">
                  {evaluation}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <School className="h-12 w-12 mb-4 opacity-20" />
                  <p>
                    Remplissez les paramètres à gauche et<br />
                    cliquez sur "Générer le contrôle"
                  </p>
                </div>
              )}
            </CardContent>
            {evaluation && (
              <CardFooter>
                <Button 
                  onClick={handleSaveEvaluation}
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement en cours...
                    </>
                  ) : (
                    <>
                      <FileCheck className="mr-2 h-4 w-4" />
                      Enregistrer dans mes documents
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default GeneratePage;
