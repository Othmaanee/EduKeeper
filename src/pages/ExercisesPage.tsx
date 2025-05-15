
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useXp } from '@/hooks/use-xp';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

const ExercisesPage: React.FC = () => {
  const [courseText, setCourseText] = useState('');
  const [subject, setSubject] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [level, setLevel] = useState('facile');
  const [format, setFormat] = useState('qcm');
  const [numQuestions, setNumQuestions] = useState('5');
  const [includeSolutions, setIncludeSolutions] = useState(true);
  const [generatedExercises, setGeneratedExercises] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { awardXP } = useXp();
  const { toast } = useToast();

  const handleGenerateExercises = async () => {
    // Vérifier si au moins l'un des champs requis est rempli
    if (inputMode === 'text' && courseText.trim().length < 20) {
      toast({
        title: "Texte trop court",
        description: "Veuillez entrer un cours plus détaillé pour générer des exercices pertinents.",
        variant: "destructive"
      });
      return;
    }

    if (inputMode === 'subject' && subject.trim().length < 3) {
      toast({
        title: "Sujet trop court",
        description: "Veuillez entrer un sujet plus détaillé pour générer des exercices pertinents.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedExercises('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour générer des exercices.",
          variant: "destructive"
        });
        return;
      }

      const requestBody = {
        courseText: inputMode === 'text' ? courseText : '',
        subject: inputMode === 'subject' ? subject : '',
        level,
        format,
        numQuestions: parseInt(numQuestions),
        includeSolutions,
        inputMode
      };

      const { data, error } = await supabase.functions.invoke('generate-exercises', {
        body: requestBody
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.exercises) {
        setGeneratedExercises(data.exercises);
        
        // Award XP for generating exercises
        const result = await awardXP('generate_exercises');
        
        if (result.success) {
          toast({
            title: "Exercices générés !",
            description: `${result.message} - Nouveau total: ${result.newTotalXp} XP (Niveau ${result.newLevel})`,
            className: "bg-green-500 text-white border-green-600"
          });
        } else {
          toast({
            title: "Exercices générés !",
            description: "Vos exercices ont été créés avec succès.",
          });
        }
      }
    } catch (error: any) {
      console.error("Error generating exercises:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la génération des exercices.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Vérifier si le bouton peut être actif
  const isGenerateButtonDisabled = () => {
    if (isGenerating) return true;
    if (inputMode === 'text') return courseText.trim().length < 20;
    if (inputMode === 'subject') return subject.trim().length < 3;
    return false;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Exercices et révisions</h1>
        
        <Tabs defaultValue="generate">
          <TabsList className="mb-4">
            <TabsTrigger value="generate">Générer un exercice</TabsTrigger>
            <TabsTrigger value="library" disabled>Bibliothèque d'exercices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Contenu pour la génération</CardTitle>
                  <CardDescription>
                    Choisissez votre mode de génération d'exercices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <RadioGroup 
                      defaultValue="text" 
                      value={inputMode}
                      onValueChange={setInputMode}
                      className="flex flex-col space-y-2 mb-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="mode-text" />
                        <Label htmlFor="mode-text">Coller un cours complet</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subject" id="mode-subject" />
                        <Label htmlFor="mode-subject">Saisir un sujet</Label>
                      </div>
                    </RadioGroup>

                    {inputMode === 'text' ? (
                      <div className="space-y-2">
                        <Label htmlFor="courseText">Contenu du cours</Label>
                        <Textarea
                          id="courseText"
                          value={courseText}
                          onChange={(e) => setCourseText(e.target.value)}
                          placeholder="Collez le texte de votre cours ici..."
                          className="min-h-[200px]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="subject">Sujet</Label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Ex: Les fonctions en mathématiques"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                  <CardDescription>
                    Personnalisez les paramètres de génération
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="level">Niveau de difficulté</Label>
                      <Select value={level} onValueChange={setLevel}>
                        <SelectTrigger id="level">
                          <SelectValue placeholder="Sélectionnez un niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facile">Facile</SelectItem>
                          <SelectItem value="moyen">Moyen</SelectItem>
                          <SelectItem value="difficile">Difficile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="format">Type d'exercice</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger id="format">
                          <SelectValue placeholder="Sélectionnez un format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="qcm">QCM</SelectItem>
                          <SelectItem value="questions_ouvertes">Questions ouvertes</SelectItem>
                          <SelectItem value="vrai_faux">Vrai ou Faux</SelectItem>
                          <SelectItem value="mixte">Format mixte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numQuestions">Nombre de questions</Label>
                      <Select value={numQuestions} onValueChange={setNumQuestions}>
                        <SelectTrigger id="numQuestions">
                          <SelectValue placeholder="Nombre de questions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 questions</SelectItem>
                          <SelectItem value="5">5 questions</SelectItem>
                          <SelectItem value="10">10 questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeSolutions" 
                        checked={includeSolutions} 
                        onCheckedChange={(checked) => setIncludeSolutions(checked as boolean)}
                      />
                      <Label htmlFor="includeSolutions">Inclure les solutions</Label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleGenerateExercises} 
                    disabled={isGenerateButtonDisabled()} 
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Génération en cours...
                      </>
                    ) : (
                      "Générer les exercices"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {generatedExercises && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Exercices générés</CardTitle>
                  <CardDescription>
                    Voici les exercices créés à partir de votre cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-md p-4 whitespace-pre-wrap">
                    {generatedExercises}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    Télécharger PDF
                  </Button>
                  <Button>
                    Enregistrer dans ma bibliothèque
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="library">
            <div className="relative">
              <p className="text-center text-muted-foreground py-10">
                La bibliothèque d'exercices sera bientôt disponible.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ExercisesPage;
