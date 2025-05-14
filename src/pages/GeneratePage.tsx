import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useXP } from '@/hooks/use-xp';
import { supabase } from '@/integrations/supabase/client';

const GeneratePage = () => {
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [instructions, setInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { awardXP } = useXP();

  const handleGenerateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Appel à la fonction Edge avec le supabase client
      const { data, error } = await supabase.functions.invoke('generate-evaluation', {
        body: {
          sujet: subject,
          classe: level,
          specialite: 'aucune', // Valeur par défaut
          difficulte: instructions || 'Moyen' // Utiliser les instructions comme niveau de difficulté
        }
      });

      if (error) {
        console.error('Error from Edge function:', error);
        throw new Error(`Une erreur est survenue lors de la génération: ${error.message}`);
      }

      console.log('Données reçues de la fonction Edge:', data);
      
      if (!data || !data.evaluation) {
        throw new Error('La réponse ne contient pas de contenu généré');
      }

      setGeneratedContent(data.evaluation);
      await awardXP('generate_control', `Contrôle: ${subject}`);
      
      // Afficher un toast de confirmation
      toast({
        title: "Contrôle prêt !",
        description: "+40 XP",
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
    } catch (error: any) {
      console.error('Error generating course:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue, veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6 animate-fade-in">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/" className="flex items-center text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à l'accueil
          </Link>
        </Button>
        
        {/* Mini walkthrough visuel */}
        <div className="mb-6 bg-muted rounded-lg p-4 flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="font-semibold">🧭</span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">1. Complétez le formulaire</span>
            <span className="text-muted-foreground hidden sm:inline">—</span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">2. Cliquez sur générer</span>
            <span className="text-muted-foreground hidden sm:inline">—</span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">3. Récupérez votre contrôle</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Générer un contrôle</CardTitle>
            <CardDescription>
              Entrez les informations pour générer un contrôle personnalisé.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="subject">Sujet</label>
              <Input
                id="subject"
                placeholder="Nom du sujet"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="level">Niveau</label>
              <Input
                id="level"
                placeholder="Niveau scolaire"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="instructions">Instructions</label>
              <Textarea
                id="instructions"
                placeholder="Instructions spécifiques"
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateCourse} disabled={isLoading || !subject || !level}>
              {isLoading ? (
                <>
                  Génération en cours...
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Générer le contrôle"
              )}
            </Button>
          </CardFooter>
        </Card>

        {generatedContent && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Contenu généré</CardTitle>
              <CardDescription>Voici le contenu généré par l'IA :</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line prose max-w-none">{generatedContent}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GeneratePage;
