
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, CalendarIcon, FileText, MoreHorizontal, FolderIcon, Trash, Download } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function DocumentGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      setCategories(data || []);
    };

    fetchCategories();
  }, []);

  // Fetch documents query
  const { 
    data: documents = [], 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['documents', sortField, sortOrder, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });
      
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get the document to get its URL
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('url')
        .eq('id', id)
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
        .eq('id', id);
      
      if (deleteError) {
        throw new Error(`Failed to delete document record: ${deleteError.message}`);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        description: "Document supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Échec de la suppression du document: ${error.message}`,
      });
    }
  });

  // Handle document deletion confirmation
  const handleConfirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
      setDocumentToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // Download document
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

  // Filter documents based on search
  const filteredDocuments = documents.filter(
    (doc) => doc.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Catégories</SelectLabel>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nom}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortField('nom')}>
                Nom
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField('created_at')}>
                Date d'importation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des documents...</p>
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive font-medium">Erreur lors du chargement des documents</p>
          <p className="text-muted-foreground mt-1">{error?.message}</p>
        </div>
      )}
      
      {/* Documents grid */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
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
                      {categories.find(cat => cat.id === doc.category_id)?.nom || 'Non catégorisé'}
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
                            setDeleteDialogOpen(true);
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
      )}
      
      {/* Empty state */}
      {!isLoading && !isError && filteredDocuments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">Aucun document trouvé</h3>
          <p className="text-muted-foreground mt-1">
            Essayez de modifier vos filtres ou d'importer de nouveaux documents.
          </p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={handleConfirmDelete}
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
    </div>
  );
}
