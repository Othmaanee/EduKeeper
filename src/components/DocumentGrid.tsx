
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  ArrowUpDown,
  CalendarIcon,
  FileText,
  FolderIcon,
  MoreHorizontal,
  Download,
  Trash,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function DocumentGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any | null>(null);
  const queryClient = useQueryClient();

  // Utiliser React Query pour récupérer les documents
  const { 
    data: documents = [], 
    isLoading: documentsLoading,
    isError: documentsError,
    error: documentsErrorDetails,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      console.log("🔍 Fetching documents");
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        throw new Error(sessionError.message);
      }
      
      const userId = session?.session?.user?.id;
      console.log("👤 User ID:", userId);
      
      // For now, we'll fetch all documents if we can't get a user ID
      const query = supabase
        .from("documents")
        .select("id, nom, url, created_at, user_id, category_id, categories(id, nom)");
      
      if (userId) {
        query.eq("user_id", userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("❌ Error fetching documents:", error);
        throw new Error(error.message);
      }
      
      console.log("📄 Documents retrieved:", data);
      return data || [];
    }
  });

  // Récupérer les catégories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log("🔍 Fetching categories");
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        throw new Error(sessionError.message);
      }
      
      const userId = session?.session?.user?.id;
      console.log("👤 User ID for categories:", userId);
      
      // For now, we'll fetch all categories if we can't get a user ID
      const query = supabase.from("categories").select("id, nom");
      
      if (userId) {
        query.eq("user_id", userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("❌ Error fetching categories:", error);
        throw new Error(error.message);
      }
      
      console.log("📂 Categories retrieved:", data);
      return data || [];
    }
  });

  // Mutation pour supprimer un document
  const deleteMutation = useMutation({
    mutationFn: async (document: any) => {
      if (!document) throw new Error("Document data is required");
      
      try {
        // Extraire le chemin relatif depuis l'URL publique
        const filePath = document.url.split("/storage/v1/object/public/documents/")[1];
  
        if (!filePath) {
          throw new Error("Impossible de récupérer le chemin du fichier");
        }
  
        // 1️⃣ Supprimer le fichier du bucket
        const { error: storageError } = await supabase.storage
          .from("documents")
          .remove([filePath]);
  
        if (storageError) {
          console.error("❌ Erreur suppression fichier storage:", storageError);
          throw new Error(storageError.message);
        }
  
        // 2️⃣ Supprimer l'entrée dans la base de données
        const { error: dbError } = await supabase
          .from("documents")
          .delete()
          .eq("id", document.id);
  
        if (dbError) {
          console.error("❌ Erreur suppression document BDD:", dbError);
          throw new Error(dbError.message);
        }
  
        return document.id;
      } catch (error: any) {
        console.error("💥 Erreur durant la suppression:", error);
        throw error; // Re-throw pour que onError puisse la capturer
      }
    },
    onSuccess: (documentId) => {
      // Invalider le cache pour forcer le rechargement des données
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Document supprimé avec succès!");
      
      // Réinitialiser l'état du dialog et du document à supprimer
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error: Error) => {
      console.error("💥 Erreur inattendue:", error);
      toast.error(`Une erreur est survenue lors de la suppression: ${error.message}`);
      
      // Même en cas d'erreur, il faut fermer le dialog pour éviter le gel
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  });

  const confirmDelete = (document: any) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDocument = () => {
    if (documentToDelete) {
      // Il est important de ne pas attendre le résultat de cette opération
      // car c'est la mutation qui va gérer l'état de l'interface
      deleteMutation.mutate(documentToDelete);
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error("Erreur lors du téléchargement", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Filtrer les documents
  const filteredDocuments = documents.filter((doc) => {
    // Toujours filtrer par terme de recherche
    const matchesSearch = doc.nom.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Si "all" categories est sélectionné, filtrer uniquement par terme de recherche
    if (selectedCategory === "all") {
      return matchesSearch;
    }
    
    // Sinon, filtrer par terme de recherche et catégorie
    return matchesSearch && doc.categories?.nom === selectedCategory;
  });

  // Trier les documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const aField = a[sortField];
    const bField = b[sortField];
    if (aField < bField) return sortOrder === "asc" ? -1 : 1;
    if (aField > bField) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Filtres */}
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
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.nom}>
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
              <DropdownMenuItem onClick={() => setSortField("nom")}>
                Titre
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField("created_at")}>
                Date d'importation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortOrder === "asc" ? "Ordre croissant" : "Ordre décroissant"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Loading State */}
      {documentsLoading && (
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Chargement des documents...</p>
        </div>
      )}

      {/* Error State */}
      {documentsError && (
        <div className="text-center py-8">
          <div className="mx-auto h-10 w-10 text-destructive">❌</div>
          <h3 className="mt-2 text-lg font-semibold">Erreur de chargement</h3>
          <p className="mt-1 text-muted-foreground">
            {documentsErrorDetails?.message || "Une erreur est survenue lors du chargement des documents."}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Grille */}
      {!documentsLoading && !documentsError && sortedDocuments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="overflow-hidden hover:shadow-md transition-shadow relative"
            >
              <CardContent className="p-0">
                <div className="h-36 bg-secondary/30 flex items-center justify-center">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate pr-8" title={doc.nom}>
                    {doc.nom}
                  </h3>
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <FolderIcon className="h-3.5 w-3.5 mr-1" />
                    {doc.categories?.nom || "Sans catégorie"}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                </div>
                <Badge variant="secondary">FICHIER</Badge>
              </CardFooter>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleDownload(doc.url, doc.nom)}
                    className="cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => confirmDelete(doc)}
                    className="cursor-pointer text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      {/* Aucune donnée */}
      {!documentsLoading && !documentsError && sortedDocuments.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="mx-auto h-10 w-10 mb-4" />
          <p>Aucun document trouvé.</p>
          <p className="mt-2">Vous pouvez importer des documents en cliquant sur "Importer" dans la barre de navigation.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/upload">Importer un document</Link>
          </Button>
        </div>
      )}

      {/* Dialog de confirmation */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={(isOpen) => {
          // Si le dialog se ferme sans action explicite, on réinitialise l'état
          if (!isOpen) {
            setDocumentToDelete(null);
            setDeleteDialogOpen(false);
          }
        }}
      >
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
              onClick={handleDeleteDocument}
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
