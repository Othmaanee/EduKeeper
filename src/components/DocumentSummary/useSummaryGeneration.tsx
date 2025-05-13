
import { useState } from 'react';
import axios from 'axios';
import { useToast } from "@/components/ui/use-toast"
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
      // Utilisation d'axios avec une configuration appropriée
      const response = await axios.post(
        'https://mtbcrbfchoqterxevvft.supabase.co/functions/v1/summarize-document', 
        { documentText: text },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await window.localStorage.getItem('supabase.auth.token')) || ''}`
          }
        }
      );
      
      // Vérification explicite de la réponse
      if (!response || !response.data) {
        throw new Error("Réponse invalide du serveur");
      }
      
      const data = response.data;
      
      if (data.error) {
        throw new Error(`Erreur serveur: ${data.error}`);
      }
      
      if (data.summary) {
        setSummary(data.summary);
        setKeywords(data.keywords || []);
        
        // Ajouter des XP à l'utilisateur lorsqu'un résumé est généré avec succès
        try {
          await awardXp('summarize_document', 'Résumé de document');
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
      
      // Nous n'ajoutons pas d'XP ici car ils ont déjà été attribués lors de la génération
      
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
