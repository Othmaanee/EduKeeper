
import { Save, Loader2, FileText } from "lucide-react";
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
import html2pdf from "html2pdf.js";

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
  saveSummaryAsPdf,
  isSavingPdf
}: SummaryDisplayProps) => {
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
        <div className="whitespace-pre-line bg-muted p-4 rounded-md text-sm">
          {generatedSummary}
        </div>
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
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.nom}
                </SelectItem>
              ))}
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
