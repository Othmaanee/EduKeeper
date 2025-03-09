
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DocumentGrid } from '../components/DocumentGrid';
import { ChevronLeft, Edit, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  // This would come from an API in a real app
  const categoryMap: Record<string, { name: string, description: string }> = {
    'math': { 
      name: 'Mathématiques',
      description: 'Tous les documents liés aux mathématiques: cours, exercices, et examens.'
    },
    'french': { 
      name: 'Français',
      description: 'Ressources pour l\'apprentissage de la langue française, la littérature et la grammaire.'
    },
    'history': { 
      name: 'Histoire',
      description: 'Documents historiques, chronologies et analyses d\'événements passés.'
    },
    'science': { 
      name: 'Sciences',
      description: 'Ressources scientifiques incluant la physique, la chimie et la biologie.'
    },
  };

  const category = id ? categoryMap[id] : { name: 'Catégorie inconnue', description: '' };

  const handleEdit = () => {
    setCategoryName(category.name);
    setShowEditDialog(true);
  };

  const saveCategory = () => {
    if (categoryName.trim()) {
      // In a real app, you would update the category in your backend
      toast.success(`Catégorie renommée en "${categoryName}"`);
      setShowEditDialog(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center text-muted-foreground">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour à l'accueil
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
        
        <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground max-w-2xl">{category.description}</p>
        )}
      </div>
      
      <DocumentGrid />
      
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
            <Button onClick={saveCategory}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CategoryPage;
