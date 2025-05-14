
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

interface SummaryDisplayProps {
  generatedSummary: string;
  categories: any[];
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  saveSummaryMutation: {
    mutate: () => void;
    isPending: boolean;
  };
  saveSummaryAsPdf: () => void;
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
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSummaryMutation.mutate();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-6 animate-fade-in space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Résumé généré</h2>
            <div className="prose max-w-none dark:prose-invert text-foreground">
              <p className="whitespace-pre-line">{generatedSummary}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
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
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSave} 
                className="flex-1"
                disabled={isSaving || saveSummaryMutation.isPending}
              >
                {(isSaving || saveSummaryMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer dans Mes Documents
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm">
        <Badge variant="outline" className="bg-primary/10 mb-2">Info</Badge>
        <p className="text-muted-foreground">
          Ce résumé a été généré par intelligence artificielle. Vous pouvez l'enregistrer dans votre collection de documents pour le consulter plus tard.
        </p>
      </div>
    </div>
  );
}
