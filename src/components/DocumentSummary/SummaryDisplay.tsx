
import { Save, Loader2 } from "lucide-react";
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
import { useRef } from "react";

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

export const SummaryDisplay = ({
  generatedSummary,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  saveSummaryMutation,
  isSavingPdf
}: SummaryDisplayProps) => {
  const summaryRef = useRef<HTMLDivElement | null>(null);
  
  // Formatage du texte avec des sauts de ligne HTML et conversion des deux sauts de ligne consécutifs en paragraphes
  const processedSummary = generatedSummary ? 
    generatedSummary.split("\n").map((line, i) => 
      `<div key=${i}>${line || "&nbsp;"}</div>`
    ).join("") : 
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
          className="whitespace-pre-line bg-muted p-4 rounded-md text-sm leading-relaxed"
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
        
        {/* Un seul bouton pour enregistrer dans Mes Documents */}
        <div className="w-full">
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
                Enregistrer dans Mes Documents
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
