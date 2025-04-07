
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BookOpen, Plus, Sliders } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import html2pdf from 'html2pdf.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

type FormValues = {
  subject: string;
  categoryId: string;
  courseLevel: string;
  courseStyle: string;
  courseDuration: string;
};

type Category = {
  id: string;
  nom: string;
};

// Fonction pour nettoyer le nom du fichier
const cleanFileName = (subject: string): string => {
  return subject
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-')     // Remplace les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '')         // Supprime les tirets au début et à la fin
    .substring(0, 50);               // Limite la longueur
};

async function generateCourse(subject: string, courseLevel: string, courseStyle: string, courseDuration: string): Promise<string> {
  console.log("Appel à la fonction generate-course avec les paramètres:", { subject, courseLevel, courseStyle, courseDuration });

  // URL complète de la fonction Edge dans Supabase
  const supabaseUrl = "https://mtbcrbfchoqterxevvft.supabase.co";
  const url = `${supabaseUrl}/functions/v1/generate-course`;
  
  console.log("URL de la fonction:", url);
  
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) {
    throw new Error("Vous devez être connecté pour générer un cours");
  }
  
  const response = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ subject, courseLevel, courseStyle, courseDuration }),
  });

  console.log("Statut de la réponse:", response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Texte de l'erreur:", errorText);
    
    let errorMessage = "Erreur lors de la génération du cours";
    try {
      const errorData = JSON.parse(errorText);
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Si on ne peut pas parser le JSON, on garde le message d'erreur par défaut
      console.error("Erreur lors du parsing de la réponse d'erreur:", e);
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log("Données reçues:", data);

  if (!data.success) {
    throw new Error(data.error || "Erreur inconnue lors de la génération");
  }

  return data.content;
}

// Fonction pour convertir le contenu HTML en PDF et obtenir un Blob
const convertToPdf = async (content: string, subject: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Créer un élément div temporaire pour contenir le contenu du cours
    const container = document.createElement('div');
    container.className = 'pdf-container';
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Ajouter un titre au document
    const title = document.createElement('h1');
    title.textContent = `Cours: ${subject}`;
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    container.appendChild(title);
    
    // Ajouter le contenu du cours
    const formattedContent = content.replace(/\n/g, '<br>');
    
    // Wrapper le contenu dans un div avec du style de base
    container.innerHTML += `
      <div style="line-height: 1.5; text-align: justify;">
        ${formattedContent}
      </div>
    `;
    
    // Ajouter le container temporaire au body pour le rendu
    document.body.appendChild(container);
    
    // Options pour html2pdf
    const options = {
      margin: [15, 15],
      filename: `cours-${cleanFileName(subject)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    try {
      // Générer le PDF
      html2pdf()
        .from(container)
        .set(options)
        .outputPdf('blob')
        .then((pdfBlob: Blob) => {
          // Nettoyer en supprimant l'élément temporaire
          document.body.removeChild(container);
          resolve(pdfBlob);
        });
    } catch (error) {
      document.body.removeChild(container);
      reject(error);
    }
  });
};

// Fonction pour uploader le PDF dans Supabase Storage
const uploadPdfToStorage = async (pdfBlob: Blob, subject: string, userId: string): Promise<string> => {
  if (!pdfBlob || pdfBlob.size === 0) {
    throw new Error("Le fichier PDF est invalide ou vide");
  }

  const fileName = `cours-${cleanFileName(subject)}-${Date.now()}.pdf`;
  const filePath = `${userId}/${fileName}`;
  
  console.log("Uploading PDF to storage path:", filePath);
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      cacheControl: '3600'
    });
  
  if (error) {
    console.error("Erreur lors de l'upload du PDF:", error);
    
    // Vérifier si l'erreur est due à un fichier existant
    if (error.message.includes('already exists')) {
      // Tenter de supprimer puis réuploader
      await supabase.storage.from('documents').remove([filePath]);
      const { data: retryData, error: retryError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });
        
      if (retryError) {
        throw new Error(`Échec de la seconde tentative d'upload: ${retryError.message}`);
      }
      
      // Obtenir l'URL publique après la seconde tentative
      const { data: retryUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      return retryUrlData.publicUrl;
    }
    
    throw new Error(`Erreur lors de l'upload du PDF: ${error.message}`);
  }
  
  // Obtenir l'URL publique
  const { data: publicUrlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);
    
  console.log("URL publique obtenue:", publicUrlData.publicUrl);
  
  return publicUrlData.publicUrl;
};

async function saveCourseToSupabase(pdfUrl: string, subject: string, userId: string, categoryId: string) {
  if (!pdfUrl || !subject || !userId) {
    throw new Error("Données manquantes pour l'enregistrement du cours");
  }
  
  const { error } = await supabase.from("documents").insert({
    nom: `Cours : ${subject}`,
    url: pdfUrl,
    user_id: userId,
    category_id: categoryId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Erreur lors de l'enregistrement du cours dans Supabase:", error);
    throw new Error("Erreur lors de l'enregistrement du cours dans Supabase");
  }
  
  console.log("Cours enregistré avec succès dans la base de données");
}

// Fonction pour récupérer les catégories de l'utilisateur
const fetchUserCategories = async (): Promise<Category[]> => {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  
  if (!userId) {
    throw new Error("Utilisateur non connecté");
  }
  
  const { data, error } = await supabase
    .from("categories")
    .select("id, nom")
    .eq("user_id", userId);
    
  if (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    throw error;
  }
  
  return data || [];
};

const GeneratePage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    defaultValues: {
      subject: '',
      categoryId: '',
      courseLevel: 'college',
      courseStyle: 'detailed',
      courseDuration: '15min',
    },
    mode: 'onSubmit'
  });

  // Récupérer les catégories
  const { data: categories, isLoading: loadingCategories, error: categoriesError } = useQuery({
    queryKey: ['userCategories'],
    queryFn: fetchUserCategories,
  });

  // Vérifier s'il y a des catégories disponibles
  const hasCategories = categories && categories.length > 0;

  const onSubmit = async (data: FormValues) => {
    if (!data.subject.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un sujet",
        variant: "destructive",
      });
      return;
    }

    if (!data.categoryId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une catégorie",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const session = await supabase.auth.getSession();
      const userId = session?.data?.session?.user?.id;

      if (!userId) {
        toast({
          title: "Erreur",
          description: "Utilisateur non connecté",
          variant: "destructive",
        });
        return;
      }

      // Étape 1: Générer le contenu du cours
      toast({
        title: "En cours",
        description: "Génération du contenu...",
      });
      const courseContent = await generateCourse(
        data.subject, 
        data.courseLevel, 
        data.courseStyle, 
        data.courseDuration
      );
      
      // Étape 2: Convertir en PDF
      toast({
        title: "En cours",
        description: "Conversion en PDF...",
      });
      const pdfBlob = await convertToPdf(courseContent, data.subject);
      
      // Étape 3: Upload dans Supabase Storage
      toast({
        title: "En cours",
        description: "Upload du fichier...",
      });
      const pdfUrl = await uploadPdfToStorage(pdfBlob, data.subject, userId);
      
      // Étape 4: Enregistrer dans la base de données
      await saveCourseToSupabase(pdfUrl, data.subject, userId, data.categoryId);
      
      toast({
        title: "Succès",
        description: "Cours généré et enregistré avec succès !",
      });
      
      navigate("/documents");
    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);
      toast({
        title: "Échec de la génération",
        description: error.message || 'Une erreur est survenue lors de la génération',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour créer une nouvelle catégorie
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom pour la catégorie",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingCategory(true);

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }

      // Insérer la nouvelle catégorie dans Supabase
      const { data, error } = await supabase
        .from("categories")
        .insert({
          nom: newCategoryName,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: `La catégorie "${newCategoryName}" a été créée`,
      });

      // Rafraîchir les catégories
      await queryClient.invalidateQueries({ queryKey: ['userCategories'] });
      
      // Sélectionner automatiquement la nouvelle catégorie
      if (data && data.id) {
        form.setValue('categoryId', data.id);
      }

      // Réinitialiser et fermer la modal
      setNewCategoryName('');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de la création de la catégorie:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la catégorie",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Générer un cours</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {categoriesError ? (
            <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
              Erreur de chargement des catégories. Veuillez rafraîchir la page.
            </div>
          ) : !hasCategories && !loadingCategories ? (
            <div className="p-4 mb-4 text-amber-700 bg-amber-100 rounded-md">
              <p className="font-medium">Aucune catégorie disponible</p>
              <p>Veuillez d'abord créer une catégorie avant de générer un cours.</p>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Créer une catégorie
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value} 
                              disabled={isGenerating || loadingCategories || !hasCategories}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner une catégorie" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingCategories ? (
                                  <SelectItem value="loading" disabled>
                                    Chargement...
                                  </SelectItem>
                                ) : (
                                  categories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.nom}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsDialogOpen(true)}
                            disabled={isGenerating}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/30 p-4 rounded-md border border-muted">
                  <div className="flex items-center gap-2 mb-3">
                    <Sliders className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Options de personnalisation</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="courseLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau du cours</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isGenerating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un niveau" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="primary">Primaire</SelectItem>
                              <SelectItem value="college">Collège</SelectItem>
                              <SelectItem value="highschool">Lycée</SelectItem>
                              <SelectItem value="university">Études supérieures</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="courseStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Style du cours</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isGenerating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="summary">Résumé simple</SelectItem>
                              <SelectItem value="detailed">Cours détaillé</SelectItem>
                              <SelectItem value="flashcards">Cours sous forme de fiches</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="courseDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée estimée</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isGenerating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir une durée" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="5min">5 minutes</SelectItem>
                              <SelectItem value="15min">15 minutes</SelectItem>
                              <SelectItem value="30min">30 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isGenerating || !hasCategories && loadingCategories}
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
          )}
          
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
              <li>Personnalisez le cours selon vos besoins avec les options disponibles</li>
              <li>Le cours sera généré en format PDF et automatiquement enregistré dans vos documents</li>
              <li>Vous pourrez retrouver et consulter ce cours dans la section Documents</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dialog pour créer une nouvelle catégorie */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Donnez un nom à votre nouvelle catégorie pour organiser vos documents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              id="categoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nom de la catégorie (ex: Mathématiques)"
              className="w-full"
              disabled={isCreatingCategory}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreatingCategory}
            >
              Annuler
            </Button>
            <Button 
              type="button"
              onClick={handleCreateCategory}
              disabled={isCreatingCategory}
            >
              {isCreatingCategory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <span>Créer</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default GeneratePage;
