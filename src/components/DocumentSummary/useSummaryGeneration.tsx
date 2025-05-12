
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Document, UserData, Category } from "./types";
import html2pdf from "html2pdf.js";
import { format } from "date-fns";

export const useSummaryGeneration = () => {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("no-category");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
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
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['documents', userData?.role],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Utilisateur non connecté");
      
      // Query depends on the user role - inclure explicitement content et summary
      let query = supabase
        .from("documents")
        .select("id, nom, url, content, summary, is_shared, user_id, category_id, categories(nom)");
      
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
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
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

  // Fonction pour générer un PDF à partir du résumé et l'uploader à Supabase
  const generateAndUploadPdf = async (summaryText: string, title: string): Promise<string> => {
    try {
      console.log("Début de la génération du PDF...");
      
      // Préparation du contenu HTML pour le PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center; margin-bottom: 20px;">${title}</h1>
          <div style="line-height: 1.6; white-space: pre-line; text-align: justify;">
            ${summaryText}
          </div>
          <div style="margin-top: 30px; font-size: 0.8em; text-align: right; color: #666;">
            Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}
          </div>
        </div>
      `;

      // Options de génération du PDF
      const options = {
        margin: [15, 15],
        filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      console.log("Conversion du HTML en PDF...");
      
      // Convertir HTML en PDF (sous forme de Blob)
      const pdfBlob = await html2pdf().from(pdfContainer).set(options).outputPdf('blob');

      // Générer un nom de fichier unique
      const fileName = `${Date.now()}_${options.filename}`;
      const filePath = `summaries/${fileName}`;

      console.log(`PDF généré, upload vers Supabase (chemin: ${filePath})...`);
      
      // Upload du PDF dans le bucket Supabase
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (error) {
        console.error("Erreur lors de l'upload du PDF:", error);
        throw error;
      }

      // Récupérer l'URL publique du fichier
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log("PDF téléversé avec succès:", publicUrlData.publicUrl);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Erreur lors de la génération ou de l'upload du PDF:", error);
      throw error;
    }
  };

  // Mutation pour sauvegarder le résumé généré en PDF et l'ajouter aux documents
  const saveSummaryAsPdfMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSummary || !userData?.id) {
        throw new Error("Informations manquantes pour l'enregistrement");
      }

      setIsSavingPdf(true);

      try {
        // Déterminer le titre du document
        let documentName = "Résumé automatique";
        let originalDocName = "";
        
        if (inputMethod === 'select' && selectedDocumentId) {
          const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
          if (selectedDocument) {
            originalDocName = selectedDocument.nom;
            documentName = `Résumé - ${selectedDocument.nom}`;
          }
        } else if (uploadedFile) {
          originalDocName = uploadedFile.name;
          documentName = `Résumé - ${uploadedFile.name}`;
        } else {
          // Si c'est du texte saisi, utiliser la date
          documentName = `Résumé automatique - ${format(new Date(), "dd-MM-yyyy")}`;
        }
        
        console.log(`Génération d'un PDF pour "${documentName}"...`);

        // Générer le PDF et l'uploader
        const pdfUrl = await generateAndUploadPdf(generatedSummary, documentName);

        // S'assurer que category_id est correctement géré
        const category_id = selectedCategoryId !== "no-category" ? selectedCategoryId : null;
        
        console.log(`Enregistrement dans la BDD avec URL: ${pdfUrl}`);
        console.log(`Category ID: ${category_id || 'aucune'}`);

        // Ajouter l'entrée dans la table documents
        const { data, error } = await supabase
          .from("documents")
          .insert({
            nom: documentName,
            user_id: userData.id,
            category_id: category_id,
            content: documentText || textInput,
            summary: generatedSummary, // Sauvegarde du résumé dans le nouveau champ
            is_shared: false,
            url: pdfUrl
          })
          .select()
          .single();
          
        if (error) {
          console.error("Erreur lors de l'enregistrement en BDD:", error);
          throw error;
        }
        
        console.log("Document enregistré avec succès:", data);
        
        // Enregistrer dans l'historique
        await supabase
          .from('history')
          .insert({
            user_id: userData.id,
            action_type: 'résumé',
            document_name: documentName
          });
        
        return data;
      } finally {
        setIsSavingPdf(false);
      }
    },
    onSuccess: () => {
      toast.success("Résumé enregistré en PDF avec succès !");
      setSelectedCategoryId("no-category");
    },
    onError: (error) => {
      console.error("Error saving PDF summary:", error);
      toast.error("Erreur lors de l'enregistrement du résumé en PDF");
    }
  });

  // Mutation pour sauvegarder le résumé généré comme texte
  const saveSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSummary || !userData?.id) {
        throw new Error("Informations manquantes pour l'enregistrement");
      }

      let documentName = "Résumé généré";
      
      if (inputMethod === 'select' && selectedDocumentId) {
        const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
        if (selectedDocument) {
          documentName = `Résumé - ${selectedDocument.nom}`;
        }
      } else if (uploadedFile) {
        documentName = `Résumé - ${uploadedFile.name}`;
      } else {
        // Si c'est du texte saisi, utiliser la date
        documentName = `Résumé automatique - ${format(new Date(), "dd-MM-yyyy")}`;
      }
      
      console.log(`Enregistrement du résumé texte pour "${documentName}"...`);
      
      // S'assurer que category_id est bien géré
      const category_id = selectedCategoryId !== "no-category" ? selectedCategoryId : null;
      
      console.log(`Category ID: ${category_id || 'aucune'}`);

      // S'assurer que content est bien inséré dans la base de données
      const { data, error } = await supabase
        .from("documents")
        .insert({
          nom: documentName,
          user_id: userData.id,
          category_id: category_id,
          content: documentText || textInput,
          summary: generatedSummary, // Sauvegarde du résumé dans le nouveau champ
          is_shared: false,
          url: null
        })
        .select()
        .single();
        
      if (error) {
        console.error("Erreur lors de l'enregistrement en BDD:", error);
        throw error;
      }
      
      console.log("Document texte enregistré avec succès:", data);
      
      return data;
    },
    onSuccess: () => {
      toast.success("Résumé enregistré avec succès !");
      setSelectedCategoryId("no-category");
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
      // Afficher un toast pour signaler le début du processus
      toast.info("Génération du résumé en cours...");
      
      // Appel à la fonction Edge Supabase
      const { data, error } = await supabase.functions.invoke('summarize-document', {
        body: {
          documentText: textToSummarize
        }
      });
      
      console.log("Réponse reçue de la fonction edge:", data);
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erreur lors de la génération du résumé");
      }
      
      if (!data || !data.success) {
        console.error("Unexpected response format or error:", data);
        throw new Error(data?.error || "Format de réponse inattendu ou erreur");
      }
      
      // Extraire le résumé de la réponse
      if (data.summary) {
        console.log("Résumé reçu:", data.summary.substring(0, 100) + "...");
        setGeneratedSummary(data.summary);
        toast.success(`Résumé généré avec succès via ${data.apiUsed} !`);
        
        // Si un document existant a été sélectionné, mettre à jour son résumé
        if (inputMethod === 'select' && selectedDocumentId) {
          try {
            const { error: updateError } = await supabase
              .from("documents")
              .update({ summary: data.summary })
              .eq('id', selectedDocumentId);
              
            if (updateError) {
              console.error("Error updating document summary:", updateError);
            } else {
              console.log("Résumé sauvegardé dans le document existant");
            }
          } catch (updateError) {
            console.error("Error in update operation:", updateError);
          }
        }
      } else {
        console.error("Unexpected response format:", data);
        throw new Error("Format de réponse inattendu");
      }
    } catch (error: any) {
      console.error("Error generating summary:", error);
      setSummaryError(error.message || "Erreur lors de la génération du résumé");
      toast.error("Échec de la génération du résumé");
    } finally {
      // Toujours s'assurer que l'indicateur de chargement est désactivé
      setIsGeneratingSummary(false);
    }
  };

  return {
    selectedDocumentId,
    setSelectedDocumentId,
    selectedCategoryId,
    setSelectedCategoryId,
    isGeneratingSummary,
    summaryError,
    generatedSummary,
    documentText,
    setDocumentText,
    textInput, 
    setTextInput,
    uploadedFile,
    setUploadedFile,
    inputMethod,
    setInputMethod,
    userData,
    documents,
    userLoading,
    documentsLoading,
    categories,
    categoriesLoading,
    handleGenerateSummary,
    saveSummaryMutation,
    saveSummaryAsPdf: saveSummaryAsPdfMutation.mutate,
    isSavingPdf
  };
};
