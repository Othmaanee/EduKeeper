
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Download, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useXp } from "@/hooks/use-xp";

interface SummaryDisplayProps {
  generatedSummary: string;
  categories: any[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  saveSummaryMutation: any;
  saveSummaryAsPdf: () => Promise<void>;
  isSavingPdf: boolean;
}

export function SummaryDisplay({
  generatedSummary,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  saveSummaryMutation,
  saveSummaryAsPdf,
  isSavingPdf
}: SummaryDisplayProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { awardXP } = useXp();
  
  const cleanFormattedSummary = (rawSummary: string) => {
    // Replace markdown headings with proper HTML formatting
    let formatted = rawSummary
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '<br/><br/>');
    
    // Split into paragraphs and format
    const paragraphs = formatted.split('\n').filter(p => p.trim().length > 0);
    
    // If there are no HTML elements yet, wrap each paragraph
    if (!formatted.includes('<h') && !formatted.includes('<br/>')) {
      formatted = paragraphs
        .map(p => `<p class="mb-3">${p}</p>`)
        .join('');
    }
    
    return formatted;
  };
  
  const saveToDocuments = async () => {
    setIsSaving(true);
    try {
      // Récupérer la session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Non connecté",
          description: "Vous devez être connecté pour sauvegarder un document",
          variant: "destructive",
        });
        return;
      }
      
      // Créer un nouveau document avec le résumé
      const { data, error } = await supabase
        .from('documents')
        .insert({
          nom: `Résumé: ${new Date().toLocaleDateString('fr-FR')}`,
          content: generatedSummary,
          summary: generatedSummary.substring(0, 150) + '...',
          user_id: session.user.id,
          category_id: selectedCategoryId === 'no-category' ? null : selectedCategoryId
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Ajouter à l'historique
      await supabase.from('history').insert({
        user_id: session.user.id,
        action_type: 'document_upload',
        document_name: `Résumé: ${new Date().toLocaleDateString('fr-FR')}`
      });
      
      toast({
        title: "Résumé sauvegardé",
        description: "Le résumé a été enregistré dans vos documents",
        className: "bg-green-500 text-white border-green-600"
      });
      
      // Attribuer de l'XP à l'utilisateur
      try {
        await awardXP('document_upload');
      } catch (xpError) {
        console.error("Erreur lors de l'attribution d'XP:", xpError);
        // Non bloquant
      }
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder: ${error.message}`,
        variant: "destructive",
      });
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const formattedSummary = cleanFormattedSummary(generatedSummary);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Résumé généré</CardTitle>
          <Badge variant="outline" className="ml-2">IA</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: formattedSummary }} />
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Catégorie</span>
            </div>
            <Select 
              value={selectedCategoryId} 
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-category">Sans catégorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={saveSummaryAsPdf}
            disabled={isSavingPdf}
          >
            {isSavingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Télécharger en PDF
              </>
            )}
          </Button>
          
          <Button
            className="w-full"
            onClick={saveToDocuments}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer dans mes documents
              </>
            )}
          </Button>
        </div>
        
        {saveSummaryMutation.isPending && (
          <div className="flex items-center justify-center w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Sauvegarde en cours...</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
