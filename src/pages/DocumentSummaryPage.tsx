
import { Layout } from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { SummaryGenerationForm } from "@/components/DocumentSummary/SummaryGenerationForm";
import { SummaryDisplay } from "@/components/DocumentSummary/SummaryDisplay";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";

// Importons le hook corrigé
import { useSummaryGeneration } from "@/components/DocumentSummary/useSummaryGeneration";

export function DocumentSummaryPage() {
  // État local pour la page
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('no-category');
  const [documentText, setDocumentText] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'upload' | 'select'>('text');
  const [userData, setUserData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [isSavingPdf, setIsSavingPdf] = useState<boolean>(false);

  // Récupération des données useSummaryGeneration
  const {
    summary,
    keywords,
    isLoading: isGeneratingSummary,
    error: summaryError,
    generateSummary,
    saveAsPdf
  } = useSummaryGeneration();

  // Charger les données utilisateur et documents au chargement de la page
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUserLoading(false);
          return;
        }

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setUserData(user);
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      } finally {
        setUserLoading(false);
      }
    };

    const loadDocuments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setDocumentsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', session.user.id);

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
      } finally {
        setDocumentsLoading(false);
      }
    };

    const loadCategories = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', session.user.id);

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };

    loadUserData();
    loadDocuments();
    loadCategories();
  }, []);

  // Fonction pour gérer la génération de résumé
  const handleGenerateSummary = async () => {
    let textToSummarize = '';
    
    if (inputMethod === 'text') {
      textToSummarize = textInput;
    } else if (inputMethod === 'select' && documentText) {
      textToSummarize = documentText;
    } else if (inputMethod === 'upload' && uploadedFile) {
      // Cette fonctionnalité nécessiterait un traitement de fichier côté serveur
      // Pour l'instant, nous utilisons juste le nom du fichier comme placeholder
      textToSummarize = `Contenu du fichier ${uploadedFile.name}`;
    }
    
    if (!textToSummarize.trim()) {
      return;
    }
    
    const result = await generateSummary(textToSummarize);
    if (result) {
      setGeneratedSummary(result.summary);
    }
  };

  // Fonction pour traiter le téléchargement de fichier
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    // Ici, on pourrait ajouter une logique pour extraire le texte du fichier
  };

  // Mutation pour sauvegarder le résumé
  const saveSummaryMutation = {
    mutate: async () => {
      // Cette fonction serait implémentée pour sauvegarder le résumé dans la base de données
      console.log("Sauvegarde du résumé...");
    },
    isPending: false
  };

  // Fonction pour sauvegarder le résumé en PDF
  const saveSummaryAsPdf = async () => {
    setIsSavingPdf(true);
    try {
      await saveAsPdf();
    } finally {
      setIsSavingPdf(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 relative">
        <h1 className="text-2xl font-bold mb-2">Résumé de Document</h1>
        <p className="text-muted-foreground mb-6">
          Générez automatiquement un résumé à partir d'un texte, d'un fichier ou d'un document existant.
        </p>
        
        {/* Mini walkthrough visuel */}
        <div className="mb-6 bg-muted rounded-lg p-4 flex items-center justify-center">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">🧭</span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">1. Dépose un doc</span>
            <span className="text-muted-foreground">—</span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">2. Clique sur un bouton IA</span>
            <span className="text-muted-foreground">—</span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">3. Récupère ta synthèse</span>
          </div>
        </div>
        
        {/* Instruction message */}
        <Alert className="bg-primary/5 border-primary/20 mb-6">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground font-medium">
            Dépose un document, clique sur un bouton IA et récupère ton cours ou ton résumé sans effort.
          </AlertDescription>
        </Alert>
        
        <SummaryGenerationForm
          documents={documents}
          userLoading={userLoading}
          documentsLoading={documentsLoading}
          isGeneratingSummary={isGeneratingSummary}
          summaryError={summaryError}
          onGenerateSummary={handleGenerateSummary}
          selectedDocumentId={selectedDocumentId}
          setSelectedDocumentId={setSelectedDocumentId}
          textInput={textInput}
          setTextInput={setTextInput}
          inputMethod={inputMethod}
          setInputMethod={setInputMethod}
          documentText={documentText}
          setDocumentText={setDocumentText}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          userData={userData}
          handleFileUpload={handleFileUpload}
        />
        
        {/* Loading indicator when generating summary */}
        {isGeneratingSummary && (
          <div className="mb-6 animate-fade-in">
            <div className="flex items-center justify-center mb-4 py-6 bg-muted/40 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground font-medium">Génération du résumé en cours...</span>
            </div>
            <Progress value={40} className="h-1" />
          </div>
        )}
        
        {/* Display the generated summary */}
        {generatedSummary && (
          <SummaryDisplay
            generatedSummary={generatedSummary}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            saveSummaryMutation={saveSummaryMutation}
            saveSummaryAsPdf={saveSummaryAsPdf}
            isSavingPdf={isSavingPdf}
          />
        )}
      </div>
    </Layout>
  );
}

export default DocumentSummaryPage;
