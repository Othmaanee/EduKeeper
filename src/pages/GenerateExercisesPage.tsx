
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Download, Flame, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import html2pdf from 'html2pdf.js';

interface Document {
  id: string;
  nom: string;
  url: string;
  user_id: string;
  is_shared: boolean;
}

interface User {
  id: string;
  role: string;
}

// Schema for the form
const formSchema = z.object({
  generationType: z.enum(['document', 'topic']),
  documentId: z.string().optional(),
  topic: z.string().optional(),
  educationLevel: z.enum(['college', 'lycee']).optional(),
  exerciseCount: z.string().min(1, "Nombre d'exercices requis"),
  exerciseType: z.enum(['simple', 'complete']),
});

type FormValues = z.infer<typeof formSchema>;

const GenerateExercisesPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [exercises, setExercises] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState<boolean>(true);
  const exercisesRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generationType: 'document',
      exerciseCount: '5',
      exerciseType: 'simple',
      educationLevel: 'college',
    }
  });

  const generationType = form.watch('generationType');
  const selectedDocId = form.watch('documentId');

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        const { data, error } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user:', error);
          return;
        }
        
        setUser(data as User);
      }
    };
    
    fetchUser();
  }, []);

  // Fetch documents based on user role
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;
      
      setLoadingDocuments(true);
      
      let query = supabase.from('documents').select('*');
      
      if (user.role === 'enseignant') {
        // Teachers can only see their own documents
        query = query.eq('user_id', user.id);
      } else {
        // Students can see their own documents or shared documents
        query = query.or(`user_id.eq.${user.id},is_shared.eq.true`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les documents.",
          variant: "destructive",
        });
      } else {
        setDocuments(data as Document[]);
      }
      
      setLoadingDocuments(false);
    };
    
    fetchDocuments();
  }, [user]);

  // Find the selected document
  const getSelectedDocument = () => {
    if (!selectedDocId) return null;
    return documents.find(doc => doc.id === selectedDocId) || null;
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setExercises('');

    try {
      let requestBody: any = {
        userRole: user?.role,
        exerciseCount: parseInt(values.exerciseCount),
        exerciseType: values.exerciseType,
      };

      if (values.generationType === 'document') {
        const selectedDoc = getSelectedDocument();
        if (!selectedDoc) {
          toast({
            title: "Sélection requise",
            description: "Veuillez sélectionner un document.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        requestBody.documentUrl = selectedDoc.url;
      } else {
        if (!values.topic) {
          toast({
            title: "Sujet requis",
            description: "Veuillez saisir un sujet pour les exercices.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        requestBody.freeFormTopic = values.topic;
        requestBody.educationLevel = values.educationLevel;
      }

      const response = await fetch('/api/generate-exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des exercices');
      }

      const data = await response.json();
      setExercises(data.exercises);
    } catch (error) {
      console.error('Error generating exercises:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les exercices, veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    form.handleSubmit(onSubmit)();
  };

  const downloadPDF = () => {
    if (!exercisesRef.current) return;
    
    const title = generationType === 'document' 
      ? `Exercices - ${getSelectedDocument()?.nom}` 
      : `Exercices - ${form.getValues('topic')}`;
      
    const element = exercisesRef.current;
    
    const opt = {
      margin: 10,
      filename: `${title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
    
    toast({
      title: "Téléchargement",
      description: "Le PDF a été généré et téléchargé.",
    });
  };

  const exerciseItems = exercises ? exercises.split('\n') : [];

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Générer des exercices</h1>
        
        {user && (
          <p className="text-lg mb-6">
            {user.role === 'enseignant' 
              ? "Créez rapidement des exercices professionnels à distribuer à vos élèves."
              : "Entraîne-toi avec des exercices personnalisés pour améliorer ta compréhension."
            }
          </p>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuration des exercices</CardTitle>
            <CardDescription>
              Personnalisez les exercices selon vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="generationType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Base de génération</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="document" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Basé sur un document existant
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="topic" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Basé sur un sujet libre
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {generationType === 'document' ? (
                  <FormField
                    control={form.control}
                    name="documentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loadingDocuments}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un document" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documents.map(doc => (
                              <SelectItem key={doc.id} value={doc.id}>
                                {doc.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sujet</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Les équations du second degré" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="educationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau scolaire</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un niveau" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="college">Collège</SelectItem>
                              <SelectItem value="lycee">Lycée</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="exerciseCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre d'exercices</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3">3 exercices</SelectItem>
                            <SelectItem value="5">5 exercices</SelectItem>
                            <SelectItem value="10">10 exercices</SelectItem>
                            <SelectItem value="15">15 exercices</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exerciseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d'exercices</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Exercices simples</SelectItem>
                            <SelectItem value="complete">Exercices complets</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Générer les exercices
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {exercises && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Exercices générés
                  {generationType === 'document' && getSelectedDocument()?.nom && (
                    <> basés sur: {getSelectedDocument()?.nom}</>
                  )}
                  {generationType === 'topic' && form.getValues('topic') && (
                    <> sur: {form.getValues('topic')}</>
                  )}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline" 
                    size="sm" 
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    {regenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regénérer
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm" 
                    onClick={downloadPDF}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={exercisesRef}
                className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
              >
                {exerciseItems.map((line, index) => {
                  if (line.trim().startsWith('Exercice') || line.trim().match(/^[0-9]+\./)) {
                    // Detect if it's a simple or complex exercise based on keywords
                    const isComplex = line.toLowerCase().includes('analyse') || 
                                      line.toLowerCase().includes('développ') || 
                                      line.toLowerCase().includes('explique') ||
                                      line.toLowerCase().includes('justifie');
                    
                    return (
                      <h3 key={index} className="font-bold mt-6 mb-2 flex items-center">
                        {line}
                        {form.getValues('exerciseType') === 'complete' && (
                          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs ${isComplex ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {isComplex ? (
                              <>
                                <Flame className="h-3 w-3 mr-1" /> Complexe
                              </>
                            ) : (
                              <>
                                <BookOpen className="h-3 w-3 mr-1" /> Simple
                              </>
                            )}
                          </span>
                        )}
                      </h3>
                    );
                  }
                  
                  return line.trim() ? <p key={index}>{line}</p> : <br key={index} />;
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GenerateExercisesPage;
