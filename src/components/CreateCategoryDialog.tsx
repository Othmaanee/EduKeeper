
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateCategoryDialogProps {
  onCategoryCreated?: () => void;
  triggerButton?: React.ReactNode;
}

export function CreateCategoryDialog({ onCategoryCreated, triggerButton }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer un nom pour la catégorie",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      const { error } = await supabase
        .from('categories')
        .insert([{ nom: categoryName }]);
      
      if (error) throw error;
      
      toast({
        description: "Catégorie créée avec succès",
      });
      
      setCategoryName('');
      setOpen(false);
      
      // Call the callback function if provided
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie: " + error.message,
        variant: "destructive",
      });
      console.error("Erreur lors de la création de la catégorie:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Créer une catégorie
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Entrez un nom pour votre nouvelle catégorie de documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateCategory}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryName">Nom de la catégorie</Label>
              <Input
                id="categoryName"
                placeholder="Exemple: Mathématiques, Histoire, Sciences..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Création..." : "Créer la catégorie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
