
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { CategoryCard } from '@/components/CategoryCard';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const CategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories and document counts
  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesError) {
        throw new Error(categoriesError.message);
      }
      
      // For each category, get document count
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const { count, error: countError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
          
          if (countError) {
            console.error('Error getting count for category', category.id, countError);
            return { ...category, count: 0 };
          }
          
          return { ...category, count: count || 0 };
        })
      );
      
      return categoriesWithCount;
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ nom: categoryName }])
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        description: "Catégorie créée avec succès.",
      });
      setShowAddDialog(false);
      setNewCategoryName('');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Échec de la création de la catégorie: ${error.message}`,
      });
    },
  });

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate(newCategoryName);
    }
  };

  // Assign a color based on the category id (for visual variety)
  const getColorForCategory = (id: string) => {
    const colors = ['blue', 'green', 'purple', 'amber', 'rose'];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Filter categories based on search
  const filteredCategories = data?.filter(
    (category) => category.nom.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Catégories</h1>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une catégorie
          </Button>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une catégorie..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Chargement des catégories...</p>
          </div>
        )}
        
        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive font-medium">Erreur lors du chargement des catégories</p>
            <p className="text-muted-foreground mt-1">Veuillez réessayer ultérieurement</p>
          </div>
        )}
        
        {/* Categories grid */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.nom}
                count={category.count}
                color={getColorForCategory(category.id)}
              />
            ))}
            
            {/* Empty state */}
            {filteredCategories.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-medium">Aucune catégorie trouvée</h3>
                <p className="text-muted-foreground mt-1">
                  {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par créer une nouvelle catégorie'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add category dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle catégorie pour organiser vos documents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block text-sm font-medium mb-2" htmlFor="category-name">
              Nom de la catégorie
            </label>
            <Input
              id="category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Mathématiques, Français, Histoire..."
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateCategory}
              disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
            >
              {createCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CategoriesPage;
