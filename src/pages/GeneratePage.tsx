import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useXp } from '@/hooks/use-xp';

const GeneratePage = () => {
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [instructions, setInstructions] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { awardXp } = useXp();

  const handleGenerateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, level, instructions }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      await awardXp('generate_control', `Contrôle: ${subject}`);
    } catch (error: any) {
      console.error('Error generating course:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du cours: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 animate-fade-in">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/" className="flex items-center text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à l'accueil
          </Link>
        </Button>

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
            <Button onClick={handleGenerateCourse} disabled={isLoading}>
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
              <div className="whitespace-pre-line">{generatedContent}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GeneratePage;
