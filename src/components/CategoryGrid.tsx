
import { useEffect, useState } from 'react';
import { Loader2, PlusCircle, FolderOpenIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CategoryCard } from './CategoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CreateCategoryDialog } from './CreateCategoryDialog';

type Category = {
  id: string;
  nom: string;
  count: number;
};

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colors for category cards
  const colors = ["blue", "green", "purple", "amber", "rose"];

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Utilisateur non connecté');
      }
      
      // Fetch categories for the current user
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, nom')
        .eq('user_id', session.user.id);
        
      if (categoriesError) {
        throw categoriesError;
      }
      
      // Fetch count of documents for each category
      const categoriesWithCount = await Promise.all(categoriesData.map(async (category) => {
        const { count, error: countError } = await supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', category.id);
          
        if (countError) {
          console.error(`Erreur lors du comptage des documents pour la catégorie ${category.nom}:`, countError);
          return { ...category, count: 0 };
        }
        
        return { ...category, count: count || 0 };
      }));
      
      setCategories(categoriesWithCount);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des catégories:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  if (loading) {
    // Afficher un squelette de chargement pendant la récupération des données
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <div className="p-5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="mt-5 h-5 w-28" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <p>Impossible de charger les catégories: {error}</p>
      </div>
    );
  }
  
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background p-8 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-3">
          <FolderOpenIcon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Aucune catégorie trouvée</h3>
        <p className="mt-2 text-muted-foreground">
          Vous n'avez pas encore créé de catégories.
        </p>
        <div className="mt-6">
          <CreateCategoryDialog 
            onCategoryCreated={fetchCategories} 
            triggerButton={
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer une catégorie
              </Button>
            }
          />
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Mes catégories</h2>
        <CreateCategoryDialog onCategoryCreated={fetchCategories} />
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            id={category.id}
            name={category.nom || 'Sans nom'}
            count={category.count}
            color={colors[index % colors.length]}
            onDelete={fetchCategories}
          />
        ))}
      </div>
    </div>
  );
}
