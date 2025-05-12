
import { Save, Loader2, FileText, Download } from "lucide-react";
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
import 'katex/dist/katex.min.css'; // Import des styles KaTeX
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
}

// Fonction pour rendre les expressions mathématiques
const renderMathExpression = (text: string) => {
  if (!text) return '';
  
  // Regex pour trouver les expressions mathématiques délimitées par \( \) ou $ $
  const inlineRegex = /\\\((.*?)\\\)|\$(.*?)\$/g;
  // Regex pour trouver les expressions mathématiques en bloc délimitées par \[ \] ou $$ $$
  const blockRegex = /\\\[(.*?)\\\]|\$\$(.*?)\$\$/g;
  
  // Fonction pour remplacer les expressions mathématiques
  const replaceWithKatex = (match: string, inlineContent?: string, altInlineContent?: string, blockContent?: string, altBlockContent?: string) => {
    const content = inlineContent || altInlineContent || blockContent || altBlockContent || '';
    const isBlock = blockContent || altBlockContent;
    
    try {
      if (isBlock) {
        return `<div class="katex-block">${match}</div>`;
      } else {
        return `<span class="katex-inline">${match}</span>`;
      }
    } catch (error) {
      console.error('Error rendering KaTeX:', error);
      return match; // En cas d'erreur, on retourne l'expression d'origine
    }
  };
  
  // Remplacer les expressions avec du HTML qui sera traité par KaTeX
  let processedText = text
    .replace(inlineRegex, (match, p1, p2) => replaceWithKatex(match, p1, p2))
    .replace(blockRegex, (match, p1, p2) => replaceWithKatex(match, undefined, undefined, p1, p2));
  
  return processedText;
};

export const SummaryDisplay = ({
  generatedSummary,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  saveSummaryMutation,
  saveSummaryAsPdf,
  isSavingPdf
}: SummaryDisplayProps) => {
  const summaryRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    // KaTeX est importé et chargé globalement
    if (generatedSummary && summaryRef.current) {
      // KaTeX va automatiquement rendre les formules mathématiques
      console.log('KaTeX ready to render in summary');
    }
  }, [generatedSummary]);

  if (!generatedSummary) return null;
  
  // Traite le contenu pour le rendu des formules mathématiques
  const processedSummary = renderMathExpression(generatedSummary);
  
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
          className="whitespace-pre-line bg-muted p-4 rounded-md text-sm"
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
        <div className="w-full flex gap-2">
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
                Enregistrer comme texte
              </>
            )}
          </Button>
          
          <Button
            onClick={saveSummaryAsPdf}
            disabled={isSavingPdf}
            className="w-full"
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
                Enregistrer en PDF
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
