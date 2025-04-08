import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
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
import { Loader2, FileText, AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserData {
  id: string;
  role: string;
}

interface Document {
  id: string;
  nom: string;
  user_id: string;
  categories?: { nom: string };
  url: string;
  is_shared?: boolean;
}

const DocumentSummaryPage = () => {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  
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

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', userData?.role],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Utilisateur non connecté");
      
      let query = supabase.from("documents").select("*, categories(nom)");
      
      if (userData?.role === "enseignant") {
        query = query.eq('user_id', session.user.id);
      } else if (userData?.role === "user" || userData?.role === "eleve") {
        query = query.or(`user_id.eq.${session.user.id},is_shared.eq.true`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!userData?.role
  });

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
    enabled: !!userData?.id
  });

  const saveSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSummary || !selectedDocumentId || !userData?.id) {
        throw new Error("Informations manquantes pour l'enregistrement");
      }

      const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
      if (!selectedDocument) {
        throw new Error("Document non trouvé");
      }

      const newDocumentName = `${selectedDocument.nom} - Résumé`;
      
      const { data, error } = await supabase
        .from("documents")
        .insert({
          nom: newDocumentName,
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
  
  const handleGenerateSummary = async () => {
    setSummaryError(null);
    setGeneratedSummary(null);
    
    if (!selectedDocumentId) {
      setSummaryError("Veuillez choisir un document avant de générer un résumé.");
      return;
    }
    
    setIsGeneratingSummary(true);
    
    try {
      const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
      if (!selectedDocument) {
        throw new Error("Document non trouvé");
      }
      
      let documentText = "";
      if (selectedDocument.url) {
        try {
          documentText = "";
        } catch (error) {
          console.error("Error retrieving document content:", error);
          throw new Error("Impossible de récupérer le contenu du document");
        }
      } else {
        throw new Error("Document sans URL ni contenu");
      }
      
      const { data, error } = await supabase.functions.invoke("summarize-document", {
        body: {
          documentUrl: selectedDocument.url,
          documentText: documentText,
          role: userData?.role || "user"
        }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message);
      }
      
      if (data.success && data.summary) {
        setGeneratedSummary(data.summary);
        toast.success("Résumé généré avec succès !");
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("Error generating summary:", error);
      setSummaryError(error.message || "Erreur lors de la génération du résumé");
      toast.error("Échec de la génération du résumé");
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  const selectedDocument = documents?.find(doc => doc.id === selectedDocumentId);
  
  return (
    <Layout>
      <div className="container py-6 relative">
        <ComingSoonOverlay message="Sélectionnez un document et générez un résumé automatique. Fonctionnalité bientôt disponible." />
        
        <h1 className="text-2xl font-bold mb-2">Résumé de Document</h1>
        <p className="text-muted-foreground mb-6">
          Sélectionnez un document et générez un résumé automatique.
        </p>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Générer un résumé</CardTitle>
            <CardDescription>
              Choisissez le document que vous souhaitez résumer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userLoading || documentsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Chargement des documents...</span>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
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
                
                {summaryError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{summaryError}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun document disponible. Importez des documents pour pouvoir générer des résumés.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerateSummary} 
              disabled={!selectedDocumentId || isGeneratingSummary}
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
        
        {generatedSummary && (
          <Card>
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
