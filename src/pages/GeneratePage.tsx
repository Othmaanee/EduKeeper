import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useXP } from '@/hooks/use-xp';
import { supabase } from '@/integrations/supabase/client';

const GeneratePage = () => {
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('2nde');
  const [type, setType] = useState('standard');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { awardXP } = useXP();

  const handleGenerateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un sujet",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setGeneratedContent('');
    
    try {
      // Call Edge function to generate evaluation
      const { data, error } = await supabase.functions.invoke('generate-evaluation', {
        body: { 
          subject,
          level,
          type
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data || !data.evaluation) {
        throw new Error("Réponse invalide du générateur d'évaluation");
      }

      setGeneratedContent(data.evaluation);
      await awardXP('generate_control', `Contrôle: ${subject}`);
      
      // Afficher un toast de confirmation
      toast({
        title: "Succès",
        description: "Évaluation générée avec succès",
      });
      
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'évaluation. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <Link to="/" className="inline-flex items-center mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Générer une évaluation</h1>
          <p className="text-muted-foreground mt-2">
            Créez une évaluation personnalisée pour vos élèves en quelques clics
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Paramètres de génération</CardTitle>
            <CardDescription>
              Configurez les options pour générer une évaluation adaptée à vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1">
                  Sujet de l'évaluation
                </label>
                <Textarea 
                  placeholder="Entrez le sujet de l'évaluation (ex: Les fonctions en mathématiques, La Seconde Guerre Mondiale...)" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1">
                  Niveau
                </label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un niveau" />
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
                <label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1">
                  Type d'évaluation
                </label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="approfondie">Approfondie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerateCourse} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                "Générer l'évaluation"
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedContent && (
          <Card>
            <CardHeader>
              <CardTitle>Évaluation générée</CardTitle>
              <CardDescription>
                Évaluation pour {subject} (Niveau: {level}, Type: {type})
              </CardDescription>
            </CardHeader>
            <CardContent className="prose">
              {generatedContent}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default GeneratePage;
