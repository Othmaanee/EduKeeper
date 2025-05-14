import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useXp } from '@/hooks/use-xp';
import { Loader2 } from 'lucide-react';

const GeneratePage = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { awardXP } = useXp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedContent(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://mtbcrbfchoqterxevvft.supabase.co'}/functions/v1/generate-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10YmNyYmZjaG9xdGVyeGV2dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDUwNzUsImV4cCI6MjA1NzEyMTA3NX0.97PG3U92JkmrsoxmxFNxiFMwxsHc8GnQM8Xpailfhy0'}`,
        },
        body: JSON.stringify({ topic, level, quantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedContent(data);
      handleSuccess(data);
    } catch (error: any) {
      console.error("Erreur lors de la génération du contenu:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le contrôle. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour la fonction handleSuccess pour utiliser le bon type d'action XP
  const handleSuccess = async (generatedContent: any) => {
    toast({
      title: "Contrôle généré!",
      description: "Votre contrôle a été généré avec succès.",
    });

    // Attribuer des XP pour la génération de contrôle
    try {
      const xpResult = await awardXP('generate_control', 'Génération de contrôle');
      
      if (xpResult.success) {
        console.log("XP attribuée avec succès:", xpResult.message);
      } else {
        console.warn("Impossible d'attribuer XP:", xpResult.message);
      }
    } catch (error) {
      console.error("Erreur lors de l'attribution des XP:", error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Générer un contrôle</CardTitle>
            <CardDescription>Entrez les détails pour générer un contrôle personnalisé.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="topic">Sujet</Label>
                <Input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Entrez le sujet du contrôle"
                  required
                />
              </div>
              <div>
                <Label htmlFor="level">Niveau</Label>
                <Input
                  id="level"
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="Entrez le niveau (ex: collège, lycée)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity">Nombre de questions</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Nombre de questions"
                  min="1"
                  max="20"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  "Générer le contrôle"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {generatedContent && (
          <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
              <CardTitle>Contrôle généré</CardTitle>
              <CardDescription>Voici le contrôle généré selon vos critères.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generatedContent.control}
                className="min-h-[300px]"
                readOnly
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GeneratePage;
