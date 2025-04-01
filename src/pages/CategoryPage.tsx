
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash, FileText, FolderIcon, Download, MoreHorizontal, Loader2, CalendarIcon } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Type mapping for file types based on extensions
const typeColorMap: Record<string, string> = {
  PDF: 'bg-red-100 text-red-800',
  DOCX: 'bg-blue-100 text-blue-800',
  DOC: 'bg-blue-100 text-blue-800',
  PPTX: 'bg-orange-100 text-orange-800',
  PPT: 'bg-orange-100 text-orange-800',
  XLSX: 'bg-green-100 text-green-800',
  XLS: 'bg-green-100 text-green-800',
  JPG: 'bg-purple-100 text-purple-800',
  JPEG: 'bg-purple-100 text-purple-800',
  PNG: 'bg-purple-100 text-purple-800',
  TXT: 'bg-gray-100 text-gray-800',
};

// Detect file type from URL or name
const detectFileType = (url: string, name: string) => {
  const extension = url.split('.').pop()?.toUpperCase() || 
                   name.split('.').pop()?.toUpperCase() || 
                   'TXT';
  return extension;
};

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [showDocumentDeleteDialog, setShowDocumentDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch category details
  const { 
    data: category,
    isLoading: categoryLoading,
    isError: categoryError,
  } = useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      if (!id) throw new Error("Category ID is required");
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });

  // Fetch documents in this category
  const {
    data: documents = [],
    isLoading: documentsLoading,
    isError: documentsError,
  } = useQuery({
    queryKey: ['category-documents', id],
    queryFn: async () => {
      if (!id) throw new Error("Category ID is required");
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('category_id', id);
      
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!id,
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ nom: name })
        .eq('id', id as string)
        .select();
      
      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        description: "Catégorie mise à jour avec succès.",
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de la mise à jour: ${error.message}`,
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id as string);
      
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        description: "Catégorie supprimée avec succès.",
      });
      navigate('/categories');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // First get the document to get its URL
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('url')
        .eq('id', documentId)
        .single();
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Extract the file path from the URL
      const urlParts = document.url.split('/');
      const bucketName = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];
      
      // Delete the file from storage
      const { error: storageError } = await supabase
        .storage
        .from(bucketName)
        .remove([fileName]);
      
      if (storageError) {
        throw new Error(`Failed to delete file: ${storageError.message}`);
      }
      
      // Delete the document record
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (deleteError) {
        throw new Error(`Failed to delete document record: ${deleteError.message}`);
      }
      
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-documents', id] });
      toast({
        description: "Document supprimé avec succès.",
      });
      setShowDocumentDeleteDialog(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Échec de la suppression du document: ${error.message}`,
      });
    }
  });

  // Handle document download
  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Get file path from URL
      const urlParts = url.split('/');
      const bucketName = urlParts[urlParts.length - 2];
      const filePath = urlParts[urlParts.length - 1];
      
      // Generate temporary signed URL
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(filePath, 60); // 60 seconds expiry
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data?.signedUrl) {
        throw new Error("Failed to generate download URL");
      }
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        description: "Téléchargement démarré.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Échec du téléchargement: ${error.message}`,
      });
    }
  };

  // Initialize edit dialog with current category name
  React.useEffect(() => {
    if (category) {
      setNewCategoryName(category.nom);
    }
  }, [category]);

  const handleUpdateCategory = () => {
    if (newCategoryName.trim()) {
      updateCategoryMutation.mutate(newCategoryName);
    }
  };

  const handleDeleteCategory = () => {
    deleteCategoryMutation.mutate();
  };

  const handleDeleteDocument = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete);
    }
  };

  if (categoryLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (categoryError || !category) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/categories" className="flex items-center text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux catégories
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-medium">Erreur lors du chargement de la catégorie</h3>
            <p className="text-muted-foreground mt-1">
              Cette catégorie n'existe pas ou a été supprimée.
            </p>
            <Button variant="default" asChild className="mt-4">
              <Link to="/categories">Voir toutes les catégories</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/categories" className="flex items-center text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux catégories
              </Link>
            </Button>
            <h1 className="text-3xl font-semibold tracking-tight">{category.nom}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Renommer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Statistiques</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Nombre de documents</div>
                  <div className="text-2xl font-semibold">{documents.length}</div>
                </div>
                
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Date de création</div>
                  <div className="text-lg font-medium">
                    {new Date(category.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Type de fichiers</div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(
                      new Set(documents.map(doc => 
                        detectFileType(doc.url, doc.nom)
                      ))
                    ).map(fileType => (
                      <Badge 
                        key={fileType} 
                        variant="secondary"
                        className={cn("font-normal", typeColorMap[fileType] || "")}
                      >
                        {fileType}
                      </Badge>
                    ))}
                    {documents.length === 0 && (
                      <span className="text-muted-foreground text-sm">Aucun document</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-medium mb-4">Documents récents</h2>
              {documentsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.slice(0, 3).map((doc) => {
                    const fileType = detectFileType(doc.url, doc.nom);
                    return (
                      <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="h-28 bg-secondary/30 flex items-center justify-center">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                          <div className="p-4">
                            <Link to={`/documents/${doc.id}`}>
                              <h3 className="font-medium truncate" title={doc.nom}>
                                {doc.nom}
                              </h3>
                            </Link>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                            {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          <Badge 
                            variant="secondary"
                            className={cn("font-normal", typeColorMap[fileType] || "")}
                          >
                            {fileType}
                          </Badge>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <h3 className="text-lg font-medium">Aucun document dans cette catégorie</h3>
                  <p className="text-muted-foreground mt-1">
                    Importez des documents pour les ajouter à cette catégorie.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/upload">
                      Importer des documents
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium">Tous les documents</h2>
              <Button asChild variant="default">
                <Link to="/upload">
                  Ajouter des documents
                </Link>
              </Button>
            </div>
            
            {documentsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => {
                  const fileType = detectFileType(doc.url, doc.nom);
                  return (
                    <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="h-36 bg-secondary/30 flex items-center justify-center">
                          <FileText className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                        <div className="p-4">
                          <Link to={`/documents/${doc.id}`}>
                            <h3 className="font-medium truncate" title={doc.nom}>
                              {doc.nom}
                            </h3>
                          </Link>
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <FolderIcon className="h-3.5 w-3.5 mr-1" />
                            {category.nom}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant="secondary"
                            className={cn("font-normal", typeColorMap[fileType] || "")}
                          >
                            {fileType}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(doc.url, doc.nom)}>
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setDocumentToDelete(doc.id);
                                  setShowDocumentDeleteDialog(true);
                                }}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Aucun document dans cette catégorie</h3>
                <p className="text-muted-foreground mt-1">
                  Importez des documents pour les ajouter à cette catégorie.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/upload">
                    Importer des documents
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez le nom de la catégorie. Cela n'affectera pas les documents existants.
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
              placeholder="Nom de la catégorie"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending || !newCategoryName.trim()}
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

      {/* Delete Category Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action ne supprimera pas les documents associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategoryMutation.isPending ? (
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
      
      {/* Delete Document Dialog */}
      <AlertDialog open={showDocumentDeleteDialog} onOpenChange={setShowDocumentDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocumentMutation.isPending ? (
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
    </Layout>
  );
};

export default CategoryPage;
