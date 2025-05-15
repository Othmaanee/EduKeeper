
import { useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { useXp } from '@/hooks/use-xp';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface SummaryResult {
  summary: string;
  keywords: string[];
}

export function useSummaryGeneration() {
  const [summary, setSummary] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSavingToDocuments, setIsSavingToDocuments] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Importer le hook useXp pour gérer les récompenses XP
  const { awardXP } = useXp();

  const generateSummary = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setSummary('');
    setKeywords([]);
    
    try {
      // Récupérer directement le token d'authentification via la session Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;
      
      console.log("Session récupérée:", !!sessionData?.session);
      
      if (!authToken) {
        console.error("Aucun token d'authentification trouvé");
        throw new Error("Session d'authentification invalide. Veuillez vous reconnecter.");
      }
      
      console.log("Envoi de la demande de résumé à Supabase Edge Function");
      
      // Utilisation d'axios avec une configuration appropriée
      const response = await axios.post(
        'https://mtbcrbfchoqterxevvft.supabase.co/functions/v1/summarize-document', 
        { documentText: text },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      console.log("Réponse reçue:", response.status);
      
      // Vérification explicite de la réponse
      if (!response || !response.data) {
        console.error("Réponse invalide:", response);
        throw new Error("Réponse invalide du serveur");
      }
      
      const data = response.data;
      
      if (data.error) {
        console.error("Erreur serveur:", data.error);
        throw new Error(`Erreur serveur: ${data.error}`);
      }
      
      if (data.summary) {
        setSummary(data.summary);
        setKeywords(data.keywords || []);
        
        // Ajouter des XP à l'utilisateur lorsqu'un résumé est généré avec succès
        try {
          console.log("Attribution des XP pour la génération de résumé...");
          await awardXP('generate_summary');
          
        } catch (xpError) {
          console.error("Erreur lors de l'attribution des XP:", xpError);
          // Ne pas bloquer l'interface pour un échec d'attribution XP
        }
        
        return {
          summary: data.summary,
          keywords: data.keywords || []
        };
      } else {
        throw new Error("Contenu du résumé manquant dans la réponse");
      }
    } catch (error: any) {
      console.error("Erreur complète:", error);
      
      // Amélioration du logging pour le débogage
      if (error.response) {
        console.error("Détails de la réponse d'erreur:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        });
        
        // Essayer de récupérer le corps d'erreur
        if (error.response.status === 401) {
          setError("Erreur d'authentification. Veuillez vous reconnecter.");
          toast({
            title: "Erreur d'authentification",
            description: "Votre session a expiré. Veuillez vous reconnecter.",
            variant: "destructive",
          });
          return null;
        }
        
        try {
          const responseText = JSON.stringify(error.response.data);
          console.error("Texte de réponse:", responseText);
        } catch (e) {
          console.error("Impossible de parser la réponse");
        }
      }
      
      const errorMessage = error.message || "Erreur inconnue lors de la génération du résumé.";
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: "Impossible de générer le résumé. Veuillez réessayer.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const saveAsPdf = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const doc = new jsPDF();
      
      // Formatage pour le PDF
      const formattedSummary = summary
        .replace(/^### (.*$)/gim, '\n\n$1\n')
        .replace(/^## (.*$)/gim, '\n\n$1\n')
        .replace(/^# (.*$)/gim, '\n\n$1\n');
      
      // Ajouter du texte au PDF avec largeur limitée et retour automatique à la ligne
      const splitText = doc.splitTextToSize(formattedSummary, 180);
      doc.text(splitText, 15, 20);
      
      // Télécharger le PDF avec un nom de fichier significatif
      doc.save("resume-" + new Date().toISOString().slice(0, 10) + ".pdf");
      
      toast({
        title: "PDF enregistré",
        description: "Votre résumé a été sauvegardé en PDF avec succès.",
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
      
    } catch (error: any) {
      setError(error.message || "Erreur inconnue lors de la sauvegarde en PDF.");
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder en PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Nouvelle fonction pour enregistrer le résumé dans "Mes documents"
  const saveToDocuments = async (categoryId: string | null = null) => {
    setIsSavingToDocuments(true);
    
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error("Veuillez vous connecter pour enregistrer ce document");
      }
      
      // Préparer les données
      const documentData = {
        nom: `Résumé: Document du ${new Date().toLocaleDateString('fr-FR')}`,
        content: summary,
        user_id: sessionData.session.user.id,
        category_id: categoryId === 'no-category' ? null : categoryId,
        is_shared: false
      };
      
      // Enregistrer dans la table documents
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Document enregistré",
        description: "Le résumé a été enregistré dans vos documents.",
        className: "bg-green-500 text-white border-green-600"
      });
      
      return data;
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement du résumé dans les documents:", error);
      
      toast({
        title: "Erreur",
        description: `Impossible d'enregistrer le résumé: ${error.message}`,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsSavingToDocuments(false);
    }
  };

  return {
    summary,
    keywords,
    isLoading,
    error,
    isSavingToDocuments,
    generateSummary,
    saveAsPdf,
    saveToDocuments
  };
}
