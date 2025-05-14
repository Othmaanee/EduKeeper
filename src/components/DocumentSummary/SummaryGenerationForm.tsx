
import { useState, useEffect } from "react";
import { FileText, FileUp, Book, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Document } from "./types";

interface SummaryGenerationFormProps {
  documents: Document[];
  userLoading: boolean;
  documentsLoading: boolean;
  isGeneratingSummary: boolean;
  summaryError: string | null;
  onGenerateSummary: () => Promise<void>;
  selectedDocumentId: string;
  setSelectedDocumentId: (id: string) => void;
  textInput: string;
  setTextInput: (text: string) => void;
  inputMethod: 'text' | 'upload' | 'select';
  setInputMethod: (method: 'text' | 'upload' | 'select') => void;
  documentText: string;
  setDocumentText: (text: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  userData: { id: string; role: string } | undefined;
  handleFileUpload: (file: File) => Promise<void>;
}

export const SummaryGenerationForm = ({
  documents,
  userLoading,
  documentsLoading,
  isGeneratingSummary,
  summaryError,
  onGenerateSummary,
  selectedDocumentId,
  setSelectedDocumentId,
  textInput,
  setTextInput,
  inputMethod,
  setInputMethod,
  documentText,
  setDocumentText,
  uploadedFile,
  setUploadedFile,
  userData,
  handleFileUpload
}: SummaryGenerationFormProps) => {
  const [isFileLoading, setIsFileLoading] = useState<boolean>(false);
  const [localDocumentText, setLocalDocumentText] = useState<string>("");
  
  // Mettre à jour le texte local quand documentText change
  useEffect(() => {
    setLocalDocumentText(documentText);
  }, [documentText]);
  
  // Fonction de gestion du téléversement de fichier
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsFileLoading(true);
    
    try {
      // Simuler l'extraction du texte du fichier (dans un cas réel, un service de backend serait utilisé)
      // Pour le moment, nous utilisons simplement le nom du fichier comme texte
      const extractedText = `Contenu extrait du fichier: ${file.name}`;
      setLocalDocumentText(extractedText);
      setDocumentText(extractedText);
      setUploadedFile(file);
      
      // Appeler la fonction de gestion fournie par la page parente
      await handleFileUpload(file);
    } catch (error) {
      console.error("Erreur lors du traitement du fichier:", error);
    } finally {
      setIsFileLoading(false);
    }
  };
  
  // Gérer la sélection du document et définir le texte associé
  useEffect(() => {
    if (selectedDocumentId && documents) {
      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      if (selectedDoc && selectedDoc.content) {
        setDocumentText(selectedDoc.content);
        setLocalDocumentText(selectedDoc.content);
      }
    }
  }, [selectedDocumentId, documents, setDocumentText]);

  // Déterminer si le bouton doit être actif
  const isGenerateButtonEnabled = () => {
    if (isGeneratingSummary) return false;
    
    switch (inputMethod) {
      case 'text':
        return textInput.trim().length > 0;
      case 'upload':
        return localDocumentText.trim().length > 0;
      case 'select':
        return selectedDocumentId !== '' && localDocumentText.trim().length > 0;
      default:
        return false;
    }
  };

  // Find the selected document
  const selectedDocument = documents?.find(doc => doc.id === selectedDocumentId);

  return (
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
          
          {/* File upload - Improved */}
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
                    onChange={handleFileInputChange}
                  />
                </label>
              </div>
              
              {isFileLoading && (
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2">Traitement du fichier...</span>
                </div>
              )}
              
              {uploadedFile && (
                <div className="p-3 bg-muted rounded-md flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-grow">
                    <h3 className="font-medium">{uploadedFile.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(uploadedFile.size / 1024)} Ko
                    </p>
                    {localDocumentText && (
                      <div className="mt-2">
                        <Textarea 
                          value={localDocumentText}
                          onChange={(e) => {
                            setLocalDocumentText(e.target.value);
                            setDocumentText(e.target.value);
                          }}
                          className="w-full min-h-[100px] text-xs"
                          placeholder="Contenu extrait du fichier... Vous pouvez modifier ce texte avant de générer le résumé."
                        />
                      </div>
                    )}
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
                    onValueChange={(value) => {
                      setSelectedDocumentId(value);
                      // Trouvez et définissez immédiatement le contenu du document
                      const selectedDoc = documents.find(doc => doc.id === value);
                      if (selectedDoc && selectedDoc.content) {
                        setDocumentText(selectedDoc.content);
                        setLocalDocumentText(selectedDoc.content);
                      }
                    }}
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
                    {localDocumentText && (
                      <div className="mt-2">
                        <Textarea 
                          value={localDocumentText}
                          onChange={(e) => {
                            setLocalDocumentText(e.target.value);
                            setDocumentText(e.target.value);
                          }}
                          className="w-full min-h-[100px] text-xs"
                          placeholder="Contenu du document... Vous pouvez modifier ce texte avant de générer le résumé."
                        />
                      </div>
                    )}
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
          onClick={onGenerateSummary} 
          disabled={!isGenerateButtonEnabled()}
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
  );
};
