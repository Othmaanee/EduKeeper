
import { useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { useXp } from '@/hooks/use-xp';
import { jsPDF } from 'jspdf';

interface SummaryResult {
  summary: string;
  keywords: string[];
}

export function useSummaryGeneration() {
  const [summary, setSummary] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Importer le hook useXp pour gérer les récompenses XP
  const { awardXp } = useXp();

  const generateSummary = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setSummary('');
    setKeywords([]);
    
    try {
      // Récupérer le token d'authentification Supabase
      let authToken = '';
      try {
        const localStorageAuth = window.localStorage.getItem('supabase.auth.token');
        if (localStorageAuth) {
          const parsedAuth = JSON.parse(localStorageAuth);
          authToken = parsedAuth.currentSession?.access_token || '';
        } else {
          // Essayer de récupérer via la session active
          const { data } = await axios.get('/api/get-session');
          authToken = data?.session?.access_token || '';
        }
      } catch (tokenError) {
        console.error("Erreur lors de la récupération du token:", tokenError);
      }

      if (!authToken) {
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
          await awardXp('summarize_document', 'Résumé de document');
          
          // Afficher un toast de confirmation avec l'XP gagnée
          toast({
            title: "Résumé généré avec succès !",
            description: "+20 XP",
            variant: "default",
            className: "bg-green-500 text-white border-green-600"
          });
          
          console.log("XP attribués avec succès");
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
      
      doc.text(`Résumé: ${summary}`, 10, 10);
      doc.save("resume.pdf");
      
      toast({
        title: "PDF sauvegardé",
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

  return {
    summary,
    keywords,
    isLoading,
    error,
    generateSummary,
    saveAsPdf
  };
}
