
import { FolderOpenIcon, FileText, Trash2, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type CategoryCardProps = {
  id: string;
  name: string;
  count: number;
  color?: string;
  className?: string;
  onDelete?: () => void;
};

export function CategoryCard({ id, name, count, color = "blue", className, onDelete }: CategoryCardProps) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Determine user role for proper navigation
    const getUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (!error && data) {
        setUserRole(data.role);
      }
    };
    
    getUserRole();
  }, []);
  
  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Navigate to the appropriate route based on user role
    navigate(`/documents?category_id=${id}`);
  };

  const handleAddDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/upload?category_id=${id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        description: "Catégorie supprimée avec succès.",
      });
      
      // Call the onDelete callback to refresh the category list
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie: " + error.message,
        variant: "destructive",
      });
      console.error("Erreur de suppression:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
    green: "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40",
    purple: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40",
    amber: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40",
    rose: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40",
  };

  return (
    <>
      <Link 
        to={`/documents?category_id=${id}`}
        onClick={handleCategoryClick}
        className={cn(
          "group relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-all duration-300",
          "hover:shadow-premium hover:-translate-y-1",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className={cn(
            "inline-flex items-center justify-center rounded-lg p-2.5",
            colorMap[color]
          )}>
            <FolderOpenIcon className="h-5 w-5" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-muted-foreground">
              {count} document{count !== 1 ? 's' : ''}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
              onClick={handleAddDocument}
              title="Ajouter un document"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Ajouter un document</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              title="Supprimer la catégorie"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Supprimer</span>
            </Button>
          </div>
        </div>
        
        <div className="mt-5">
          <h3 className="font-medium text-lg tracking-tight">{name}</h3>
          <div className="mt-1 text-muted-foreground text-sm line-clamp-2">
            {count > 0 ? (
              <>
                <FileText className="inline-block h-3.5 w-3.5 mr-1.5 align-text-bottom" />
                Explorez tous les documents
              </>
            ) : (
              "Aucun document disponible dans cette catégorie."
            )}
          </div>
        </div>

        <div className="h-1 absolute bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:opacity-100 opacity-0 transition-opacity" />
      </Link>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-card-dark dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette catégorie ?
              Cette action est irréversible et supprimera la catégorie "{name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
