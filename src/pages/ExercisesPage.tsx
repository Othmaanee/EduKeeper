
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, BookText, FileText, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import html2pdf from 'html2pdf.js';
import { ComingSoonOverlay } from '@/components/ComingSoonOverlay';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

// Styles pour l'export PDF - maintenant inline dans un objet JavaScript
const pdfExportStyles = {
  pdfExport: `
    font-family: Arial, sans-serif;
    line-height: 1.5;
    padding: 20px;
    background: white !important;
    color: black !important;
  `,
  exercisesContent: `
    & h1, & h2, & h3 {
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
  `
};

// Ajout d'une feuille de style à l'exécution pour les styles PDF
const addPdfStyles = () => {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .pdf-export {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      padding: 20px;
      background: white !important;
      color: black !important;
    }
    .exercises-content h1, .exercises-content h2, .exercises-content h3 {
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
  `;
  document.head.appendChild(styleEl);
  return () => {
    document.head.removeChild(styleEl);
  };
};

const ExercisesPage = () => {
  const [sujet, setSujet] = useState('');
  const [classe, setClasse] = useState('6e');
  const [niveau, setNiveau] = useState('Classique');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [userRole, setUserRole] = useState<string>('user');
  const exercisesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Ajout des styles pour PDF au montage du composant
  useEffect(() => {
    const removePdfStyles = addPdfStyles();
    return () => {
      // Nettoyage au démontage du composant
      removePdfStyles();
    };
  }, []);

  // Fetch user role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  // Fetch user's documents on component mount
  useEffect(() => {
    const fetchUserDocuments = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', session.user.id);
          
        if (error) throw error;
        
        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos documents",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDocuments();
  }, [toast]);

  const handleGenerateExercises = async () => {
    if (!sujet.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un sujet",
        variant: "destructive",
      });
      return;
    }
    
    setGenerating(true);
    setGeneratedContent('');
    
    try {
      // Appel à la fonction Edge pour générer les exercices
      const response = await supabase.functions.invoke('generate-exercises', {
        body: { sujet, classe, niveau }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la génération des exercices');
      }

      setGeneratedContent(response.data.exercices);
      toast({
        title: "Succès",
        description: "Exercices générés avec succès",
      });
    } catch (error) {
      console.error('Error generating exercises:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les exercices. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getOrCreateExerciseCategory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Veuillez vous connecter pour enregistrer des exercices');
      
      // Recherche de la catégorie "Mes exercices"
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('nom', 'Mes exercices');
        
      if (existingCategories && existingCategories.length > 0) {
        return existingCategories[0].id;
      }
      
      // Création de la catégorie si elle n'existe pas
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert([
          { nom: 'Mes exercices', user_id: session.user.id }
        ])
        .select();
        
      if (error) throw error;
      
      return newCategory[0].id;
    } catch (error) {
      console.error('Error getting/creating exercises category:', error);
      throw error;
    }
  };

  const saveExercises = async () => {
    if (!generatedContent) return;
    setIsSaving(true);
    
    try {
      // Get the category id for "Mes exercices"
      const categoryId = await getOrCreateExerciseCategory();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Veuillez vous connecter pour enregistrer les exercices');
      
      // Créer un nom descriptif pour le document
      const documentName = `Exercices: ${sujet} (${classe}, ${niveau})`;
      
      // Enregistrer dans la table documents
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            nom: documentName,
            content: generatedContent,
            user_id: session.user.id,
            is_shared: false,
            category_id: categoryId,
            url: null, // URL est maintenant nullable
          },
        ])
        .select();
        
      if (error) throw error;
      
      // Log this action in history
      await supabase
        .from('history')
        .insert([
          {
            user_id: session.user.id,
            action_type: 'génération',
            document_name: documentName,
          }
        ]);
      
      toast({
        title: "Succès",
        description: "Les exercices ont été sauvegardés dans vos documents",
      });
    } catch (error) {
      console.error('Error saving exercises:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les exercices. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!exercisesRef.current || !generatedContent) return;
    
    try {
      // Ajouter une classe temporaire pour améliorer le style du PDF
      exercisesRef.current.classList.add('pdf-export');
      
      // Options pour html2pdf
      const options = {
        margin: 10,
        filename: `Exercices_${sujet.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Attendre un peu pour s'assurer que le DOM est correctement rendu
      setTimeout(() => {
        html2pdf().from(exercisesRef.current).set(options).save().then(() => {
          // Retirer la classe temporaire
          exercisesRef.current?.classList.remove('pdf-export');
          
          toast({
            title: "Succès",
            description: "Les exercices ont été téléchargés en PDF",
          });
        });
      }, 500);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const getDescription = () => {
    if (userRole === 'eleve') {
      return "Créez des exercices personnalisés afin de vous entraîner pour votre prochain contrôle";
    }
    return "Créez des exercices personnalisés pour vos élèves en quelques clics";
  };

  return (
    <Layout>
      <div className="container py-8 relative">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Générer des exercices</h1>
          <p className="text-muted-foreground mt-2">
            {getDescription()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Paramètres de génération</CardTitle>
              <CardDescription>
                Configurez les options pour générer des exercices adaptés à vos besoins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Sujet du cours*
                  </Label>
                  <Textarea 
                    placeholder="Entrez le sujet du cours (ex: Les fractions en mathématiques, Conjugaison au passé composé...)" 
                    value={sujet}
                    onChange={e => setSujet(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Classe
                  </Label>
                  <Select value={classe} onValueChange={setClasse}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6e">6ème</SelectItem>
                      <SelectItem value="5e">5ème</SelectItem>
                      <SelectItem value="4e">4ème</SelectItem>
                      <SelectItem value="3e">3ème</SelectItem>
                      <SelectItem value="2nde">2nde</SelectItem>
                      <SelectItem value="1ere">1ère</SelectItem>
                      <SelectItem value="Terminale">Terminale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Niveau
                  </Label>
                  <Select value={niveau} onValueChange={setNiveau}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bases">Bases</SelectItem>
                      <SelectItem value="Classique">Classique</SelectItem>
                      <SelectItem value="Très complet">Très complet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateExercises} 
                disabled={generating || !sujet.trim()}
                className="w-full sm:w-auto"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <BookText className="mr-2 h-4 w-4" />
                    Générer les exercices
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {generatedContent && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Exercices générés</CardTitle>
                  <CardDescription>
                    Exercices pour {sujet} (Niveau: {niveau}, Classe: {classe})
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveExercises} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Enregistrer dans mes documents
                      </>
                    )}
                  </Button>
                  <Button onClick={downloadAsPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger en PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  ref={exercisesRef}
                  className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap font-mono text-sm"
                  style={{ maxHeight: '800px', overflow: 'auto' }}
                >
                  <div className="exercises-content" dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br/>') }} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ExercisesPage;
