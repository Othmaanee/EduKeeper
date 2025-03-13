
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DocumentGrid } from '../components/DocumentGrid';
import { ChevronLeft, Edit, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch category details
  const {
    data: category,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      if (!id) throw new Error('ID de catégorie non défini');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!id,
  });

  // Fetch document count
  const { data: documentCount = 0 } = useQuery({
    queryKey: ['category-document-count', id],
    queryFn: async () => {
      if (!id) return 0;

      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

      if (error) {
        console.error("Erreur lors du comptage des documents:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!id,
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!id) throw new Error('ID de catégorie non défini');

      const { data, error } = await supabase
        .from('categories')
        .update({ nom: newName })
        .eq('id', id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        description: "Catégorie renommée avec succès.",
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Échec de la mise à jour de la catégorie: ${error.message}`,
      });
    },
  });

  useEffect(() => {
    if (category) {
      setCategoryName(category.nom);
    }
  }, [category]);

  const handleEdit = () => {
    setCategoryName(category?.nom || '');
    setShowEditDialog(true);
  };

  const saveCategory = () => {
    if (categoryName.trim()) {
      updateCategoryMutation.mutate(categoryName);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement de la catégorie...</p>
        </div>
      </Layout>
    );
  }

  if (isError || !category) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive font-medium">Catégorie introuvable</p>
          <p className="text-muted-foreground mt-1">Cette catégorie n'existe pas ou a été supprimée.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/categories">Retour aux catégories</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/categories" className="flex items-center text-muted-foreground">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour aux catégories
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Renommer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <h1 className="text-3xl font-semibold tracking-tight">{category.nom}</h1>
        <p className="mt-2 text-muted-foreground">
          {documentCount} document{documentCount !== 1 ? 's' : ''} dans cette catégorie
        </p>
      </div>
      
      <Tabs defaultValue="grid" className="mt-6">
        <TabsList>
          <TabsTrigger value="grid">Grille</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="mt-4">
          <DocumentGrid />
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <DocumentGrid />
        </TabsContent>
      </Tabs>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez le nom de cette catégorie. Cette action n'affectera pas les documents existants.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block text-sm font-medium mb-2" htmlFor="category-name">
              Nom de la catégorie
            </label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Entrez un nom"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={saveCategory}
              disabled={updateCategoryMutation.isPending || !categoryName.trim() || categoryName === category.nom}
            >
              {updateCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CategoryPage;
