
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
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
import { Loader2, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DocumentSummaryPage = () => {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Fetch user role
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Utilisateur non connecté");
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      
      setUserRole(data.role);
      return data;
    }
  });

  // Fetch documents based on user role
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', userRole],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Utilisateur non connecté");
      
      // Query depends on the user role
      let query = supabase.from("documents").select("*, categories(nom)");
      
      if (userRole === "enseignant") {
        // Enseignants can only see their own documents
        query = query.eq('user_id', session.user.id);
      } else if (userRole === "user" || userRole === "eleve") {
        // Élèves can see their documents and shared documents
        query = query.or(`user_id.eq.${session.user.id},is_shared.eq.true`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!userRole, // Only run the query when userRole is available
  });
  
  const handleGenerateSummary = () => {
    // Clear any previous errors
    setSummaryError(null);
    
    // Check if a document is selected
    if (!selectedDocumentId) {
      setSummaryError("Veuillez choisir un document avant de générer un résumé.");
      return;
    }
    
    // Start the "fake" summary generation process
    setIsGeneratingSummary(true);
    
    // Simulate a delay (will be replaced with actual API call later)
    setTimeout(() => {
      setIsGeneratingSummary(false);
      toast.success("Résumé généré avec succès !");
      // Later we'll actually display the summary here
    }, 3000);
  };
  
  // Find the selected document
  const selectedDocument = documents?.find(doc => doc.id === selectedDocumentId);
  
  return (
    <Layout>
      <div className="container py-6">
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
        
        {/* Result area - will be populated later when we implement the actual AI functionality */}
        {/*
        <Card>
          <CardHeader>
            <CardTitle>Résumé généré</CardTitle>
          </CardHeader>
          <CardContent>
            {/* The summary will be displayed here when the AI feature is implemented */}
        {/*</CardContent>
        </Card>
        */}
      </div>
    </Layout>
  );
};

export default DocumentSummaryPage;
