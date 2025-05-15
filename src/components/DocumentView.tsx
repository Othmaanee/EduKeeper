import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Download, Share, Clock, FileText, 
  Pencil, Trash, FolderOpen, Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const detectFileType = (url: string, name: string) => {
  const extension = url.split('.').pop()?.toUpperCase() || 
                  name.split('.').pop()?.toUpperCase() || 
                  'TXT';
  return extension;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [category, setCategory] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { 
    data: documentData, 
    isLoading: documentLoading,
    isError: documentError,
    error: documentErrorDetails,
  } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) throw new Error("Document ID is required");
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }
  });

  const { 
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ documentId, categoryId }: { documentId: string, categoryId: string }) => {
      const { error } = await supabase
        .from('documents')
        .update({ category_id: categoryId })
        .eq('id', documentId);
      
      if (error) throw new Error(error.message);
      return { documentId, categoryId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      toast.success("Catégorie mise à jour");
      setShowCategoryDialog(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!documentData) throw new Error("Document data is required");
      
      console.log("🗑️ Début du processus de suppression du document:", documentId);
      
      // Vérifier si le document a une URL qui pointe vers Storage
      const isStorageDocument = documentData.url && documentData.url.includes('/storage/v1/object/public/');
      
      // Si c'est un document stocké dans Storage, on supprime le fichier
      if (isStorageDocument) {
        const urlParts = documentData.url.split('/');
        const bucketName = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1];
        
        console.log("📂 Tentative de suppression du fichier:", fileName, "dans le bucket:", bucketName);
        const { error: storageError } = await supabase
          .storage
          .from(bucketName)
          .remove([fileName]);
        
        if (storageError) {
          console.error("❌ Échec de la suppression du fichier:", storageError.message);
          // On continue malgré l'erreur pour supprimer au moins l'entrée en base de données
          console.warn("On continue pour supprimer l'entrée en base de données");
        } else {
          console.log("✅ Fichier supprimé avec succès");
        }
      }
      
      console.log("🗄️ Tentative de suppression de l'enregistrement en base de données");
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);
      
      if (deleteError) {
        console.error("❌ Échec de la suppression en base de données:", deleteError.message);
        throw new Error(`Failed to delete document record: ${deleteError.message}`);
      }
      
      console.log("✅ Enregistrement supprimé avec succès");

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        console.error("❌ Impossible de récupérer l'ID utilisateur");
        throw new Error("User ID is required for history tracking");
      }
      
      console.log("👤 ID utilisateur récupéré:", userId);
      console.log("📝 Tentative d'ajout dans l'historique: suppression -", documentData.nom);
      
      const { error: historyError } = await supabase
        .from('history')
        .insert([{
          user_id: userId,
          action_type: 'suppression',
          document_name: documentData.nom,
        }]);
      
      if (historyError) {
        console.error("❌ Erreur lors de l'insertion dans l'historique:", historyError);
      } else {
        console.log("✅ Action 'suppression' ajoutée à l'historique avec succès");
      }
      
      return documentId;
    },
    onSuccess: () => {
      toast.success("Document supprimé");
      
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      navigate('/documents');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  useEffect(() => {
    if (documentData?.category_id) {
      setCategory(documentData.category_id);
    }
  }, [documentData]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  const isAIGenerated = documentData?.nom?.startsWith('Cours :');

  // Remplacer la fonction handleDownload par celle-ci qui télécharge directement le fichier
  const handleDownload = async () => {
    if (!documentData) return;
    
    try {
      const documentUrl = documentData.url;
      console.log("URL du document à télécharger:", documentUrl);
      
      if (!documentUrl) {
        throw new Error("L'URL du document est invalide");
      }

      // Créer un élément a invisible
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentData.nom || 'document'; // Nom du fichier pour le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Téléchargement du document démarré");
    } catch (error: any) {
      toast.error(`Erreur de téléchargement du document: ${error.message}`);
      console.error("Erreur lors du téléchargement du document:", error);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/documents/${id}`);
    toast.success("Lien copié dans le presse-papiers");
  };

  const handleDelete = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  const handleCategoryChange = () => {
    if (id && category) {
      updateCategoryMutation.mutate({ documentId: id, categoryId: category });
    }
  };

  if (documentLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement du document...</p>
      </div>
    );
  }

  if (documentError || !documentData) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Erreur lors du chargement du document
          </h2>
          <p className="mt-2 text-muted-foreground">
            {documentErrorDetails?.message || "Le document n'a pas pu être trouvé."}
          </p>
          <Button variant="default" asChild className="mt-4">
            <Link to="/documents">Retour aux documents</Link>
          </Button>
        </div>
      </div>
    );
  }

  const fileType = detectFileType(documentData.url, documentData.nom);

  const currentCategory = categories.find(cat => cat.id === documentData.category_id);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/documents" className="flex items-center text-muted-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour aux documents
          </Link>
        </Button>
      </div>
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {documentData.nom}
            {isAIGenerated && (
              <Badge variant="secondary" className="ml-2 font-normal">
                🔥 Généré IA
              </Badge>
            )}
          </h1>
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1.5" />
            <span>Importé le {formatDate(documentData.created_at)}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button variant="default" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Partager
          </Button>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
        <div className="p-4 bg-secondary border-b border-border flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            <span className="font-medium">Aperçu du document</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {currentCategory?.nom || 'Non catégorisé'}
          </Badge>
        </div>
        
        <div className="p-8 flex items-center justify-center min-h-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAyMGMwIDExLjA0Ni04Ljk1NCAyMC0yMCAyMHMtMjAtOC45NTQtMjAtMjAgOC45NTQtMjAgMjAtMjAgMjAgOC45NTQgMjAgMjB6bS0yMCAyYy0xMC40OTMgMC0xOS0zLjEzNC0xOS03cy44MzMtNyAxOS03IDE5IDMuMTM0IDE5IDctOC41MDcgNy0xOSA3eiIgZmlsbD0iI2YxZjVmOSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PC9nPjwvc3ZnPg==')]">
          {['JPG', 'JPEG', 'PNG', 'GIF'].includes(fileType) ? (
            <img 
              src={documentData.url} 
              alt={documentData.nom} 
              className="max-h-[500px] max-w-full object-contain" 
            />
          ) : (
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Prévisualisation {fileType} non disponible.
                <br />
                <Button variant="link" className="mt-2" onClick={handleDownload}>
                  Télécharger pour voir le contenu
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-secondary/50 border border-border rounded-lg p-4">
        <h3 className="font-medium mb-4">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCategoryDialog(true)}
            disabled={categoriesLoading}
          >
            {categoriesLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4 mr-2" />
            )}
            Modifier la catégorie
          </Button>
          <Button 
            variant="outline" 
            className="text-destructive hover:bg-destructive/10" 
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash className="h-4 w-4 mr-2" />
            )}
            Supprimer
          </Button>
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Sélectionnez une nouvelle catégorie pour ce document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nom}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem key="no-categories" value="no-categories" disabled>
                    Aucune catégorie disponible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCategoryChange}
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
