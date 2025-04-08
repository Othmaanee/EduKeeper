
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BookText, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

const ExercisesPage = () => {
  const [selectedTab, setSelectedTab] = useState('document');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [freeTopicText, setFreeTopicText] = useState('');
  const [exerciseCount, setExerciseCount] = useState('5');
  const [exerciseType, setExerciseType] = useState('simple');
  const [educationLevel, setEducationLevel] = useState('college');
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const { toast } = useToast();

  // Fetch user's documents on component mount
  React.useEffect(() => {
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
    setGenerating(true);
    setGeneratedContent('');
    
    try {
      // Prepare the prompt based on user selections
      let prompt = '';
      
      if (selectedTab === 'document') {
        if (!selectedDocument) {
          toast({
            title: "Erreur",
            description: "Veuillez sélectionner un document",
            variant: "destructive",
          });
          return;
        }
        
        const selectedDoc = documents.find(doc => doc.id === selectedDocument);
        prompt = `Génère ${exerciseCount} exercices ${exerciseType === 'simple' ? 'simples' : 'complets'} de niveau ${educationLevel === 'college' ? 'collège' : 'lycée'} basés sur le document: ${selectedDoc?.nom || 'Document inconnu'}`;
      } else {
        if (!freeTopicText.trim()) {
          toast({
            title: "Erreur",
            description: "Veuillez entrer un sujet",
            variant: "destructive",
          });
          return;
        }
        
        prompt = `Génère ${exerciseCount} exercices ${exerciseType === 'simple' ? 'simples' : 'complets'} de niveau ${educationLevel === 'college' ? 'collège' : 'lycée'} sur le sujet: ${freeTopicText}`;
      }
      
      // For now we'll simulate the API call with a timeout
      // In a real app, this would make an actual API call
      setTimeout(() => {
        const exerciseTypes = exerciseType === 'simple' ? 
          ['QCM', 'Vrai ou Faux', 'Questions courtes'] : 
          ['Questions ouvertes', 'Analyse de texte', 'Dissertations', 'Problèmes complexes'];
          
        const levelText = educationLevel === 'college' ? 'Collège' : 'Lycée';
        const topic = selectedTab === 'document' ? 
          documents.find(doc => doc.id === selectedDocument)?.nom || 'Document sélectionné' : 
          freeTopicText;
          
        let generatedText = `# Exercices sur "${topic}"\n\n`;
        generatedText += `Niveau: ${levelText}\n`;
        generatedText += `Type: ${exerciseType === 'simple' ? 'Exercices simples' : 'Exercices complets'}\n\n`;
        
        for (let i = 1; i <= parseInt(exerciseCount); i++) {
          const exerciseTypeIdx = Math.floor(Math.random() * exerciseTypes.length);
          generatedText += `## Exercice ${i} (${exerciseTypes[exerciseTypeIdx]})\n\n`;
          
          if (exerciseTypes[exerciseTypeIdx] === 'QCM') {
            generatedText += `**Question:** Question relative à ${topic}\n\n`;
            generatedText += `- A) Première option\n`;
            generatedText += `- B) Deuxième option\n`;
            generatedText += `- C) Troisième option\n`;
            generatedText += `- D) Quatrième option\n\n`;
            generatedText += `**Réponse correcte:** B\n\n`;
          } else if (exerciseTypes[exerciseTypeIdx] === 'Vrai ou Faux') {
            generatedText += `**Affirmation:** Affirmation relative à ${topic}\n\n`;
            generatedText += `**Réponse:** Vrai (avec explication)\n\n`;
          } else {
            generatedText += `**Question:** Question approfondie relative à ${topic}\n\n`;
            generatedText += `**Aide:** Indices ou éléments à considérer pour répondre\n\n`;
            generatedText += `**Réponse attendue:** Éléments clés que la réponse devrait contenir\n\n`;
          }
        }
        
        setGeneratedContent(generatedText);
        setGenerating(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error generating exercises:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les exercices. Veuillez réessayer.",
        variant: "destructive",
      });
      setGenerating(false);
    }
  };

  const saveExercises = async () => {
    try {
      if (!generatedContent) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Get topic from tab selection
      const topic = selectedTab === 'document' ? 
        documents.find(doc => doc.id === selectedDocument)?.nom || 'Document sélectionné' : 
        freeTopicText;
        
      // Create a random URL for the document (this would actually upload the document in a real app)
      const documentUrl = `https://example.com/exercises/${Date.now()}.pdf`;
      
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            nom: `Exercices: ${topic}`,
            url: documentUrl,
            user_id: session.user.id,
            is_shared: false,
          },
        ])
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Les exercices ont été sauvegardés dans vos documents",
      });
      
      // Log this action in history
      await supabase
        .from('history')
        .insert([
          {
            user_id: session.user.id,
            action_type: 'génération',
            document_name: `Exercices: ${topic}`,
          }
        ]);
        
    } catch (error) {
      console.error('Error saving exercises:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les exercices. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Générer des exercices</h1>
          <p className="text-muted-foreground mt-2">
            Créez des exercices personnalisés pour vos élèves en quelques clics
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Paramètres de génération</CardTitle>
            <CardDescription>
              Configurez les options pour générer des exercices adaptés à vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="document">À partir d'un document</TabsTrigger>
                <TabsTrigger value="topic">À partir d'un sujet libre</TabsTrigger>
              </TabsList>
              <TabsContent value="document" className="pt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span>Chargement des documents...</span>
                  </div>
                ) : (
                  <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un document" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.length > 0 ? (
                        documents.map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.nom}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Aucun document disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </TabsContent>
              <TabsContent value="topic" className="pt-4">
                <Textarea 
                  placeholder="Entrez un sujet pour générer des exercices (ex: Les fractions en mathématiques, Conjugaison au passé composé, etc.)" 
                  value={freeTopicText}
                  onChange={e => setFreeTopicText(e.target.value)}
                  className="min-h-[100px]"
                />
              </TabsContent>
            </Tabs>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre d'exercices
                </label>
                <Select value={exerciseCount} onValueChange={setExerciseCount}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 exercices</SelectItem>
                    <SelectItem value="5">5 exercices</SelectItem>
                    <SelectItem value="10">10 exercices</SelectItem>
                    <SelectItem value="15">15 exercices</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Type d'exercices
                </label>
                <ToggleGroup 
                  type="single" 
                  value={exerciseType}
                  onValueChange={(value) => value && setExerciseType(value)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="simple" aria-label="Exercices simples">
                    Exercices simples
                  </ToggleGroupItem>
                  <ToggleGroupItem value="complex" aria-label="Exercices complets">
                    Exercices complets
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Niveau
                </label>
                <ToggleGroup 
                  type="single" 
                  value={educationLevel}
                  onValueChange={(value) => value && setEducationLevel(value)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="college" aria-label="Collège">
                    Collège
                  </ToggleGroupItem>
                  <ToggleGroupItem value="lycee" aria-label="Lycée">
                    Lycée
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerateExercises} 
              disabled={
                generating || 
                (selectedTab === 'document' && !selectedDocument) ||
                (selectedTab === 'topic' && !freeTopicText.trim())
              }
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
                  Voici les exercices générés selon vos critères
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveExercises}>
                  <FileText className="mr-2 h-4 w-4" />
                  Enregistrer dans mes documents
                </Button>
                <Button>
                  Télécharger
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
                {generatedContent}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ExercisesPage;
