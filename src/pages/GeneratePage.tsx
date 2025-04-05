import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import html2pdf from 'html2pdf.js';

type FormValues = {
  subject: string;
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

async function generateCourse(subject: string): Promise<string> {
  console.log("Appel à la fonction generate-course avec le sujet:", subject);

  // URL complète de la fonction Edge dans Supabase
  const supabaseUrl = "https://mtbcrbfchoqterxevvft.supabase.co";
  const url = `${supabaseUrl}/functions/v1/generate-course`;
  
  console.log("URL de la fonction:", url);
  
  const response = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ subject }),
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
    throw new Error(`Erreur lors de l'upload du PDF: ${error.message}`);
  }
  
  // Obtenir l'URL publique
  const { data: publicUrlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);
    
  console.log("URL publique obtenue:", publicUrlData.publicUrl);
  
  return publicUrlData.publicUrl;
};

async function saveCourseToSupabase(pdfUrl: string, subject: string, userId: string) {
  const { error } = await supabase.from("documents").insert({
    nom: `Cours : ${subject}`,
    url: pdfUrl,
    user_id: userId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error("Erreur lors de l'enregistrement du cours dans Supabase");
  }
}

const GeneratePage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    defaultValues: {
      subject: '',
    },
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
      const courseContent = await generateCourse(data.subject);
      
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
      await saveCourseToSupabase(pdfUrl, data.subject, userId);
      
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
              <li>Le cours sera généré en format PDF et automatiquement enregistré dans vos documents</li>
              <li>Vous pourrez retrouver et consulter ce cours dans la section Documents</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GeneratePage;
