
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

type FormValues = {
  subject: string;
};

const GeneratePage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    defaultValues: {
      subject: '',
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (subject: string) => {
      try {
        // Appel à la fonction edge pour générer le contenu du cours
        const response = await fetch(`${window.location.origin}/functions/v1/generate-course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ subject }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Une erreur est survenue lors de la génération');
        }

        const data = await response.json();
        
        if (!data.content) {
          throw new Error('Contenu vide reçu');
        }
        
        return data.content;
      } catch (error: any) {
        console.error('Erreur lors de la génération:', error);
        throw new Error(error.message || 'Une erreur est survenue');
      }
    },
    onSuccess: async (content, subject) => {
      try {
        // Sauvegarde dans la table documents
        const documentName = `Cours : ${subject}`;
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .insert([
            {
              nom: documentName,
              url: content, // Nous stockons directement le contenu texte dans l'URL pour ce cas spécifique
              user_id: (await supabase.auth.getUser()).data.user?.id,
              category_id: null
            }
          ])
          .select();

        if (documentError) {
          throw documentError;
        }

        // Invalider le cache pour que la liste des documents se mette à jour
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        
        toast({
          title: "Cours généré avec succès",
          description: `Le cours sur "${subject}" a été généré et enregistré dans vos documents.`,
        });
        
        // Réinitialiser le formulaire
        form.reset();
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde:', error);
        toast({
          title: "Erreur lors de la sauvegarde",
          description: error.message || 'Une erreur est survenue lors de la sauvegarde du cours',
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de la génération",
        description: error.message || 'Une erreur est survenue lors de la génération',
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  const onSubmit = async (data: FormValues) => {
    if (!data.subject.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un sujet",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate(data.subject);
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Générer un cours</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sujet du cours</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Par exemple : Révolution Française, Système solaire, Théorème de Pythagore..." 
                        {...field} 
                        disabled={isGenerating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Génération en cours...</span>
                    </>
                  ) : (
                    <span>Générer un cours</span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
          
          {isGenerating && (
            <div className="mt-6 p-4 bg-secondary/20 rounded-md">
              <p className="text-center text-muted-foreground">
                Génération en cours... Cela peut prendre jusqu'à une minute.
              </p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Comment ça fonctionne</h2>
            <ul className="text-sm list-disc pl-5 text-muted-foreground space-y-1">
              <li>Saisissez un sujet précis pour obtenir un meilleur cours</li>
              <li>Le cours généré sera automatiquement enregistré dans vos documents</li>
              <li>Vous pourrez retrouver et consulter ce cours dans la section Documents</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GeneratePage;
