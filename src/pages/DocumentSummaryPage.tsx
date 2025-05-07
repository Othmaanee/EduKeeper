import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, AlertCircle, Save, FileUp, Book } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// Define the UserData type to ensure proper TypeScript typing
interface UserData {
  id: string;
  role: string;
}

interface Document {
  id: string;
  nom: string;
  user_id: string;
  categories?: { nom: string };
  url: string | null;
  is_shared?: boolean;
  content: string | null; // Content est correctement typé comme string | null
  category_id?: string | null;
}

const DocumentSummaryPage = () => {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'upload' | 'select'>('text');
  
  // Fetch user data (both id and role)
  const { data: userData, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Utilisateur non connecté");
      
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
      
      return data as UserData;
    }
  });

  // Fetch documents based on user role
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', userData?.role],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Utilisateur non connecté");
      
      // Query depends on the user role - inclure explicitement content
      let query = supabase
        .from("documents")
        .select("id, nom, url, content, is_shared, user_id, category_id, categories(nom)");
      
      if (userData?.role === "enseignant") {
        // Enseignants can only see their own documents
        query = query.eq('user_id', session.user.id);
      } else if (userData?.role === "user" || userData?.role === "eleve") {
        // Élèves can see their documents and shared documents
        query = query.or(`user_id.eq.${session.user.id},is_shared.eq.true`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!userData?.role, // Only run the query when userData.role is available
  });

  // Fetch user categories for the dropdown
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['userCategories'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Utilisateur non connecté");
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!userData?.id,
  });
  
  // Mutation to save generated summary as a new document
  const saveSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSummary || !userData?.id) {
        throw new Error("Informations manquantes pour l'enregistrement");
      }

      let documentName = "Résumé généré";
      
      if (inputMethod === 'select' && selectedDocumentId) {
        const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
        if (selectedDocument) {
          documentName = `${selectedDocument.nom} - Résumé`;
        }
      } else if (uploadedFile) {
        documentName = `${uploadedFile.name} - Résumé`;
      }
      
      // S'assurer que content est bien inséré dans la base de données
      const { data, error } = await supabase
        .from("documents")
        .insert({
          nom: documentName,
          user_id: userData.id,
          category_id: selectedCategoryId || null,
          content: generatedSummary,
          is_shared: false,
          url: null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      toast.success("Résumé enregistré avec succès !");
      setSelectedCategoryId("");
    },
    onError: (error) => {
      console.error("Error saving summary:", error);
      toast.error("Erreur lors de l'enregistrement du résumé");
    }
  });

  // Function to fetch text content from a URL
  const fetchDocumentContent = async (url: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(url);
      if (error) throw error;
      
      return await data.text();
    } catch (error) {
      console.error("Error fetching document content:", error);
      throw new Error("Impossible de récupérer le contenu du document");
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    
    try {
      // Read file content as text
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      
      setDocumentText(text);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Erreur lors de la lecture du fichier");
    }
  };
  
  const handleGenerateSummary = async () => {
    // Clear any previous errors and summaries
    setSummaryError(null);
    setGeneratedSummary(null);
    
    let textToSummarize = "";
    
    // Get the text to summarize based on the input method
    if (inputMethod === 'text') {
      textToSummarize = textInput;
    } else if (inputMethod === 'upload') {
      textToSummarize = documentText;
    } else if (inputMethod === 'select') {
      // Check if a document is selected
      if (!selectedDocumentId) {
        setSummaryError("Veuillez choisir un document avant de générer un résumé.");
        return;
      }
      
      // Find the selected document to get its URL
      const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
      if (!selectedDocument) {
        throw new Error("Document non trouvé");
      }
      
      // Get document text from URL or content
      if (selectedDocument.url) {
        try {
          textToSummarize = await fetchDocumentContent(selectedDocument.url);
        } catch (error) {
          console.error("Error retrieving document content:", error);
          setSummaryError("Impossible de récupérer le contenu du document");
          return;
        }
      } else if (selectedDocument.content) {
        textToSummarize = selectedDocument.content;
      } else {
        setSummaryError("Document sans contenu");
        return;
      }
    }
    
    if (!textToSummarize.trim()) {
      setSummaryError("Aucun contenu à résumer");
      return;
    }
    
    // Start the summary generation process
    setIsGeneratingSummary(true);
    
    try {
      // Get the environment variable for the Hugging Face API key
      const apiKey = process.env.HUGGINGFACE_API_KEY || '';
      
      // Call the Hugging Face API
      const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: textToSummarize })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      const summaryText = data[0]?.summary_text;
      
      if (summaryText) {
        setGeneratedSummary(summaryText);
        toast.success("Résumé généré avec succès !");
      } else {
        throw new Error("Format de réponse inattendu");
      }
    } catch (error: any) {
      console.error("Error generating summary:", error);
      setSummaryError(error.message || "Erreur lors de la génération du résumé");
      toast.error("Échec de la génération du résumé");
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  // Find the selected document
  const selectedDocument = documents?.find(doc => doc.id === selectedDocumentId);
  
  return (
    <Layout>
      <div className="container py-6 relative">
        <h1 className="text-2xl font-bold mb-2">Résumé de Document</h1>
        <p className="text-muted-foreground mb-6">
          Générez automatiquement un résumé à partir d'un texte, d'un fichier ou d'un document existant.
        </p>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Générer un résumé</CardTitle>
            <CardDescription>
              Choisissez votre méthode d'entrée et générez un résumé automatique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input method selector */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button 
                  variant={inputMethod === 'text' ? "default" : "outline"} 
                  onClick={() => setInputMethod('text')}
                  className="flex items-center"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Saisir du texte
                </Button>
                <Button 
                  variant={inputMethod === 'upload' ? "default" : "outline"} 
                  onClick={() => setInputMethod('upload')}
                  className="flex items-center"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Importer un fichier
                </Button>
                <Button 
                  variant={inputMethod === 'select' ? "default" : "outline"} 
                  onClick={() => setInputMethod('select')}
                  className="flex items-center"
                >
                  <Book className="mr-2 h-4 w-4" />
                  Choisir un document existant
                </Button>
              </div>
              
              {/* Text input */}
              {inputMethod === 'text' && (
                <div className="space-y-2">
                  <label htmlFor="text-input" className="text-sm font-medium block">
                    Texte à résumer
                  </label>
                  <Textarea 
                    id="text-input"
                    placeholder="Collez votre texte ici..."
                    className="min-h-[200px]"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                </div>
              )}
              
              {/* File upload */}
              {inputMethod === 'upload' && (
                <div className="space-y-4">
                  <label className="text-sm font-medium block">
                    Fichier à résumer
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="file-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/25">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Cliquez pour importer</span> ou glissez-déposez
                        </p>
                        <p className="text-xs text-muted-foreground/70">Fichiers texte (TXT, MD) ou PDF</p>
                      </div>
                      <Input 
                        id="file-input" 
                        type="file" 
                        className="hidden" 
                        accept=".txt,.md,.pdf"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  
                  {uploadedFile && (
                    <div className="p-3 bg-muted rounded-md flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">{uploadedFile.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(uploadedFile.size / 1024)} Ko
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Document selection from existing */}
              {inputMethod === 'select' && (
                <div className="space-y-4">
                  {userLoading || documentsLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Chargement des documents...</span>
                    </div>
                  ) : documents.length > 0 ? (
                    <div>
                      <label htmlFor="document-select" className="text-sm font-medium block mb-2">
                        Document à résumer
                      </label>
                      <Select 
                        value={selectedDocumentId} 
                        onValueChange={setSelectedDocumentId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionnez un document" />
                        </SelectTrigger>
                        <SelectContent>
                          {documents.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.nom}
                              {doc.user_id !== userData?.id && " (Partagé)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Aucun document disponible. Importez des documents pour pouvoir générer des résumés.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {selectedDocument && (
                    <div className="p-3 bg-muted rounded-md flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">{selectedDocument.nom}</h3>
                        <p className="text-sm text-muted-foreground">
                          Catégorie: {selectedDocument.categories?.nom || "Sans catégorie"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {summaryError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{summaryError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerateSummary} 
              disabled={
                isGeneratingSummary || 
                (inputMethod === 'text' && !textInput.trim()) ||
                (inputMethod === 'upload' && !documentText.trim()) ||
                (inputMethod === 'select' && !selectedDocumentId)
              }
              className="w-full"
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Résumé en cours...
                </>
              ) : (
                'Générer un résumé'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Loading indicator when generating summary */}
        {isGeneratingSummary && (
          <div className="mb-6 animate-fade-in">
            <div className="text-center mb-2 text-sm text-muted-foreground">
              Analyse et création du résumé en cours...
            </div>
            <Progress value={undefined} className="h-1" />
          </div>
        )}
        
        {/* Display the generated summary */}
        {generatedSummary && (
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Résumé généré</CardTitle>
              <CardDescription>
                Voici le résumé automatique de votre document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line bg-muted p-4 rounded-md text-sm">
                {generatedSummary}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {/* Category selection */}
              <div className="w-full">
                <label htmlFor="category-select" className="text-sm font-medium block mb-2">
                  Catégorie (optionnel)
                </label>
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sans catégorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Save button */}
              <Button 
                onClick={() => saveSummaryMutation.mutate()}
                disabled={saveSummaryMutation.isPending}
                className="w-full"
                variant="default"
              >
                {saveSummaryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer ce résumé
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DocumentSummaryPage;
