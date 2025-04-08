import { useState, useEffect } from "react";
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
  Loader2,
  User,
  Share,
  Eye,
  X
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
  DropdownMenuCheckboxItem,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";
import html2pdf from 'html2pdf.js';
import { DocumentActions } from "@/components/TeacherDashboard/DocumentActions";

type DocumentGridProps = {
  initialCategoryId?: string | null;
}

type FilterStatus = "all" | "shared" | "personal";

export function DocumentGrid({ initialCategoryId }: DocumentGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId || "all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any | null>(null);
  const [assignCategoryDialogOpen, setAssignCategoryDialogOpen] = useState(false);
  const [documentToAssign, setDocumentToAssign] = useState<any | null>(null);
  const [categoryToAssign, setCategoryToAssign] = useState<string | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategory(initialCategoryId);
    }
  }, [initialCategoryId]);

  const resetFilters = () => {
    setSearchTerm("");
    setSortField("created_at");
    setSortOrder("desc");
    setSelectedCategory("all");
    setFilterStatus("all");
    toast.success("Filtres réinitialisés");
  };

  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      const userId = session?.user?.id || null;
      setCurrentUserId(userId);
      return userId;
    }
  });

  const { 
    data: documents = [], 
    isLoading: documentsLoading,
    isError: documentsError,
    error: documentsErrorDetails,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      console.log("🔍 Fetching documents");
      
      const { data, error } = await supabase
        .from("documents")
        .select("*, categories(id, nom)");
      
      if (error) {
        console.error("❌ Error fetching documents:", error);
        throw new Error(error.message);
      }
      
      console.log("📄 Documents retrieved:", data);
      return data || [];
    }
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log("🔍 Fetching categories");
      
      const { data, error } = await supabase
        .from("categories")
        .select("id, nom");
      
      if (error) {
        console.error("❌ Error fetching categories:", error);
        throw new Error(error.message);
      }
      
      console.log("📂 Categories retrieved:", data);
      return data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (document: any) => {
      if (!document) throw new Error("Document data is required");
      
      if (document.user_id !== currentUserId) {
        throw new Error("Vous ne pouvez pas supprimer un document partagé");
      }
      
      console.log("🗑️ Début du processus de suppression pour le document:", document.id, document.nom);
      
      try {
        const filePath = document.url.split("/storage/v1/object/public/documents/")[1];
  
        if (!filePath) {
          throw new Error("Impossible de récupérer le chemin du fichier");
        }
  
        console.log("📂 Tentative de suppression du fichier:", filePath);
        const { error: storageError } = await supabase.storage
          .from("documents")
          .remove([filePath]);
  
        if (storageError) {
          console.error("❌ Erreur suppression fichier storage:", storageError);
          throw new Error(storageError.message);
        }
  
        console.log("✅ Fichier supprimé avec succès du stockage");
        console.log("🗄️ Tentative de suppression de l'enregistrement en base de données");
        
        const { error: dbError } = await supabase
          .from("documents")
          .delete()
          .eq("id", document.id);
  
        if (dbError) {
          console.error("❌ Erreur suppression document BDD:", dbError);
          throw new Error(dbError.message);
        }
        
        console.log("✅ Document supprimé avec succès de la base de données");
        console.log("📝 Tentative d'ajout dans l'historique: suppression -", document.nom);
        
        if (!currentUserId) {
          console.error("❌ ID utilisateur non disponible pour l'historique");
          throw new Error("User ID is required for history tracking");
        }
        
        const { data: historyData, error: historyError } = await supabase
          .from('history')
          .insert([
            {
              user_id: currentUserId,
              action_type: 'suppression',
              document_name: document.nom,
            }
          ])
          .select();
        
        if (historyError) {
          console.error("❌ Erreur lors de l'insertion dans l'historique:", historyError.message);
          console.error("Détails de l'erreur:", historyError);
        } else {
          console.log("✅ Action 'suppression' ajoutée à l'historique avec succès:", historyData);
        }
  
        return document.id;
      } catch (error: any) {
        console.error("💥 Erreur durant la suppression:", error);
        throw error;
      }
    },
    onSuccess: (documentId) => {
      console.log("🔄 Invalidation du cache pour history et documents");
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      
      toast.success("Document supprimé avec succès!");
      
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error: Error) => {
      console.error("💥 Erreur inattendue:", error);
      toast.error(`Une erreur est survenue lors de la suppression: ${error.message}`);
      
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  });

  const assignCategoryMutation = useMutation({
    mutationFn: async ({ documentId, categoryId }: { documentId: string, categoryId: string | null }) => {
      console.log(`⏳ Assignation du document ${documentId} à la catégorie ${categoryId}`);
      
      const { error } = await supabase
        .from("documents")
        .update({ category_id: categoryId })
        .eq("id", documentId);
        
      if (error) {
        console.error("❌ Erreur lors de l'assignation:", error);
        throw error;
      }
      
      return { documentId, categoryId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Catégorie mise à jour avec succès!");
      setAssignCategoryDialogOpen(false);
      setDocumentToAssign(null);
      setCategoryToAssign(null);
    },
    onError: (error: Error) => {
      toast.error(`Une erreur est survenue lors de l'assignation: ${error.message}`);
    }
  });

  const confirmDelete = (document: any) => {
    if (document.user_id !== currentUserId) {
      toast.error("Vous ne pouvez pas supprimer un document partagé");
      return;
    }
    
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };
  
  const openAssignCategoryDialog = (document: any) => {
    setDocumentToAssign(document);
    setCategoryToAssign(document.category_id || null);
    setAssignCategoryDialogOpen(true);
  };

  const handleDeleteDocument = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete);
    }
  };
  
  const handleAssignCategory = () => {
    if (documentToAssign) {
      assignCategoryMutation.mutate({
        documentId: documentToAssign.id,
        categoryId: categoryToAssign
      });
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

  const handleGeneratePDF = async (doc: any) => {
    try {
      setDownloadingDoc(doc.id);
      
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.fontFamily = 'Arial, sans-serif';
      
      const title = document.createElement('h1');
      title.textContent = doc.nom;
      title.style.borderBottom = '1px solid #ddd';
      title.style.paddingBottom = '10px';
      title.style.marginBottom = '20px';
      container.appendChild(title);
      
      const metadata = document.createElement('div');
      metadata.style.fontSize = '12px';
      metadata.style.color = '#666';
      metadata.style.marginBottom = '20px';
      metadata.innerHTML = `
        <p>Date de création: ${new Date(doc.created_at).toLocaleDateString("fr-FR")}</p>
        <p>Catégorie: ${doc.categories?.nom || "Sans catégorie"}</p>
        <p>Statut: ${doc.is_shared ? "Partagé" : "Personnel"}</p>
      `;
      container.appendChild(metadata);
      
      try {
        const response = await fetch(doc.url);
        const text = await response.text();
        
        if (text && !text.includes('') && text.length < 500000) {
          const content = document.createElement('div');
          content.style.lineHeight = '1.6';
          content.style.fontSize = '14px';
          
          if (text.includes('<html') || text.includes('<body')) {
            const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            content.innerHTML = bodyMatch ? bodyMatch[1] : text;
          } else {
            const paragraphs = text.split(/\n\s*\n/);
            paragraphs.forEach(paragraph => {
              if (paragraph.trim()) {
                const p = document.createElement('p');
                p.textContent = paragraph.trim();
                content.appendChild(p);
              }
            });
          }
          
          container.appendChild(content);
        } else {
          const placeholder = document.createElement('p');
          placeholder.textContent = "Ce document ne peut pas être prévisualisé dans le PDF. Veuillez ouvrir le document original.";
          container.appendChild(placeholder);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du contenu:", error);
        const errorMsg = document.createElement('p');
        errorMsg.textContent = "Impossible de charger le contenu du document.";
        container.appendChild(errorMsg);
      }
      
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      const opt = {
        margin: 10,
        filename: `${doc.nom}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(container).save();
      
      document.body.removeChild(container);
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleViewDocument = (url: string) => {
    window.open(url, '_blank');
    toast.success("Document ouvert dans un nouvel onglet");
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.nom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const categoryMatch = selectedCategory === "all" || doc.category_id === selectedCategory;
    
    let statusMatch = true;
    if (filterStatus === "shared") {
      statusMatch = doc.is_shared === true;
    } else if (filterStatus === "personal") {
      statusMatch = doc.user_id === currentUserId;
    }
    
    return matchesSearch && categoryMatch && statusMatch;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortField === "nom") {
      return sortOrder === "asc" 
        ? a.nom.localeCompare(b.nom) 
        : b.nom.localeCompare(a.nom);
    } else if (sortField === "created_at") {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
    
    return 0;
  });

  const isPersonalDocument = (doc: any) => {
    return doc.user_id === currentUserId;
  };

  return (
    <div className="space-y-6">
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
              <DropdownMenuItem 
                onClick={() => setSortField("nom")}
                className={sortField === "nom" ? "bg-secondary" : ""}
              >
                Titre
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortField("created_at")}
                className={sortField === "created_at" ? "bg-secondary" : ""}
              >
                Date d'importation
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filterStatus === "all"}
                onCheckedChange={() => setFilterStatus("all")}
              >
                Tous les documents
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterStatus === "shared"}
                onCheckedChange={() => setFilterStatus("shared")}
              >
                Documents partagés
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterStatus === "personal"}
                onCheckedChange={() => setFilterStatus("personal")}
              >
                Documents personnels
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortOrder === "asc" ? "Ordre croissant" : "Ordre décroissant"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon" onClick={resetFilters} title="Réinitialiser les filtres">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-secondary/50">
          Tri: {sortField === "nom" ? "Titre" : "Date d'importation"}
        </Badge>
        <Badge variant="outline" className="bg-secondary/50">
          Ordre: {sortOrder === "asc" ? "Croissant" : "Décroissant"}
        </Badge>
        {filterStatus !== "all" && (
          <Badge variant="outline" className="bg-secondary/50">
            Statut: {filterStatus === "shared" ? "Partagés" : "Personnels"}
          </Badge>
        )}
      </div>

      {documentsLoading && (
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Chargement des documents...</p>
        </div>
      )}

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

      {!documentsLoading && !documentsError && sortedDocuments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDocuments.map((doc) => (
            <Card
              key={doc.id}
              className={`overflow-hidden hover:shadow-md transition-shadow relative ${
                isPersonalDocument(doc) ? "border-primary/20" : "border-secondary"
              }`}
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
              <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                  </div>
                  {isPersonalDocument(doc) ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Personnel
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
                      <Share className="h-3 w-3" />
                      Partagé
                    </Badge>
                  )}
                </div>
                
                <div className="flex w-full gap-2 mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewDocument(doc.url)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ouvrir le document dans un nouvel onglet</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleGeneratePDF(doc)}
                          disabled={downloadingDoc === doc.id}
                        >
                          {downloadingDoc === doc.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Préparation...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Télécharger en PDF</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignCategoryDialog(doc)}
                        >
                          <FolderIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Assigner à une catégorie</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {isPersonalDocument(doc) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => confirmDelete(doc)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Supprimer ce document</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!documentsLoading && !documentsError && sortedDocuments.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="mx-auto h-10 w-10 mb-4" />
          <p>Aucun document trouvé {selectedCategory !== "all" && "dans cette catégorie"}.</p>
          <p className="mt-2">
            {selectedCategory !== "all" 
              ? "Essayez une autre catégorie ou importez un document dans cette catégorie."
              : "Vous pouvez importer des documents en cliquant sur \"Importer\" dans la barre de navigation."
            }
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/upload">Importer un document</Link>
          </Button>
        </div>
      )}

      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={(isOpen) => {
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
      
      <Dialog
        open={assignCategoryDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setAssignCategoryDialogOpen(false);
            setDocumentToAssign(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner à une catégorie</DialogTitle>
            <DialogDescription>
              Sélectionnez une catégorie pour ce document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Select 
              value={categoryToAssign || ""} 
              onValueChange={(value) => setCategoryToAssign(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sans catégorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAssignCategoryDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleAssignCategory}
              disabled={assignCategoryMutation.isPending}
            >
              {assignCategoryMutation.isPending ? (
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
    </div>
  );
}
