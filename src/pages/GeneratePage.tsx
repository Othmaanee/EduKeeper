import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useXp } from '@/hooks/use-xp';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const GeneratePage = () => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    instructions: '',
    gradeLevel: '',
    numberOfQuestions: '5',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { awardXP } = useXp();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, gradeLevel: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Make instructions optional by removing it from the validation check
    if (!formData.title || !formData.subject || !formData.gradeLevel || !formData.numberOfQuestions) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Simuler une requête à l'API (à remplacer par votre logique réelle)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Récupérer l'ID de l'utilisateur connecté
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error("Utilisateur non connecté");
      }

      // Utiliser un type valide de XpActionType comme premier paramètre
      const result = await awardXP(userData.user.id, "generate_control");

      if (result.success) {
        toast({
          title: 'Succès',
          description: 'Contrôle généré avec succès !',
        });
        navigate('/accueil'); // Rediriger vers la page d'accueil
      } else {
        toast({
          title: 'Erreur',
          description: "Erreur lors de l'attribution d'XP.",
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération du contrôle. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto mt-8 p-4">
        <h1 className="text-2xl font-bold mb-4">Générer un Contrôle</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre du Contrôle</Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Contrôle de Mathématiques - Chapitre 3"
            />
          </div>
          <div>
            <Label htmlFor="subject">Matière</Label>
            <Input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Ex: Mathématiques"
            />
          </div>
          <div>
            <Label htmlFor="instructions">Instructions (facultatif)</Label>
            <Textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="Ex: Répondez à toutes les questions. Justifiez vos réponses."
            />
          </div>
          <div>
            <Label htmlFor="gradeLevel">Niveau Scolaire</Label>
            <Select onValueChange={handleSelectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6ème">6ème</SelectItem>
                <SelectItem value="5ème">5ème</SelectItem>
                <SelectItem value="4ème">4ème</SelectItem>
                <SelectItem value="3ème">3ème</SelectItem>
                <SelectItem value="2nde">2nde</SelectItem>
                <SelectItem value="1ère">1ère</SelectItem>
                <SelectItem value="Terminale">Terminale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="numberOfQuestions">Nombre de Questions</Label>
            <Input
              type="number"
              id="numberOfQuestions"
              name="numberOfQuestions"
              value={formData.numberOfQuestions}
              onChange={handleChange}
              placeholder="Ex: 5"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Génération en cours...' : 'Générer le Contrôle'}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default GeneratePage;
