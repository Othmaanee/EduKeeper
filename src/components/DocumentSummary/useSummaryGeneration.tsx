
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
      const response = await axios.post<SummaryResult>('/api/generate', { text });
      
      if (response.status !== 200) {
        throw new Error(`Erreur lors de la génération du résumé: ${response.statusText}`);
      }
      
      setSummary(response.data.summary);
      setKeywords(response.data.keywords);
      
      // Ajouter des XP à l'utilisateur lorsqu'un résumé est généré avec succès
      await awardXp('summarize_document', 'Résumé de document');
      
      return response.data;
    } catch (error: any) {
      setError(error.message || "Erreur inconnue lors de la génération du résumé.");
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
