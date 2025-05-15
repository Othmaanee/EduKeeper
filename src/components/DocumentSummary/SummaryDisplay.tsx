
import { Save, Loader2, FileText, Download, BookmarkPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useEffect, useRef } from "react";

interface Category {
  id: string;
  nom: string | null;
}

interface SummaryDisplayProps {
  generatedSummary: string | null;
  categories: Category[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  saveSummaryMutation: {
    mutate: () => void;
    isPending: boolean;
  };
  saveSummaryAsPdf: () => void;
  isSavingPdf: boolean;
  saveToDocuments?: () => void;
  isSavingToDocuments?: boolean;
}

export const SummaryDisplay = ({
  generatedSummary,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  saveSummaryMutation,
  saveSummaryAsPdf,
  isSavingPdf,
  saveToDocuments,
  isSavingToDocuments = false
}: SummaryDisplayProps) => {
  const summaryRef = useRef<HTMLDivElement | null>(null);
  
  // Formatage du texte en remplaçant les # par des balises appropriées et en ajoutant des sauts de paragraphe
  const processedSummary = generatedSummary ? 
    generatedSummary
      // Remplacer les titres avec des balises HTML appropriées
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      // Ajouter des paragraphes pour les lignes vides
      .split('\n\n')
      .map((paragraph, i) => {
        if (paragraph.trim().startsWith('<h')) return paragraph;
        return `<p class="mb-3" key=${i}>${paragraph.replace(/\n/g, '<br />')}</p>`;
      })
      .join('') : 
    '';

  if (!generatedSummary) return null;
  
  return (
    <Card className="animate-scale-in">
      <CardHeader>
        <CardTitle>Résumé généré</CardTitle>
        <CardDescription>
          Voici le résumé automatique de votre document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          ref={summaryRef}
          className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm leading-relaxed prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: processedSummary }}
        />
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
              <SelectItem key="no-category" value="no-category">Sans catégorie</SelectItem>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nom || "Catégorie sans nom"}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-categories-available" disabled>
                  Aucune catégorie disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Save buttons */}
        <div className="w-full flex flex-wrap gap-2">
          <Button 
            onClick={() => saveSummaryMutation.mutate()}
            disabled={saveSummaryMutation.isPending}
            className="flex-1"
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
                Enregistrer comme texte
              </>
            )}
          </Button>
          
          <Button
            onClick={saveSummaryAsPdf}
            disabled={isSavingPdf}
            className="flex-1"
            variant="secondary"
          >
            {isSavingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création du PDF...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Télécharger en PDF
              </>
            )}
          </Button>
        </div>
        
        {/* Added button to save to "Mes documents" */}
        {saveToDocuments && (
          <Button 
            onClick={saveToDocuments}
            disabled={isSavingToDocuments}
            className="w-full"
            variant="outline"
          >
            {isSavingToDocuments ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement dans Mes Documents...
              </>
            ) : (
              <>
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Enregistrer dans Mes Documents
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
