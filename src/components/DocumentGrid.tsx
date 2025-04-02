
import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function DocumentGrid() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;
        console.log("🧑‍💻 ID de l'utilisateur connecté :", userId);

        const { data, error } = await supabase
          .from("documents")
          .select(
            "id, nom, url, created_at, user_id, category_id, categories(nom)"
          )

          .eq("user_id", userId);

        if (error) {
          console.error("❌ Erreur récupération documents :", error);
        } else {
          console.log("📄 Documents récupérés :", data);
          setDocuments(data || []);
        }
      } catch (err) {
        console.error("💥 Erreur inattendue :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const filteredDocuments = documents.filter(
    (doc) =>
      (doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) &&
        selectedCategory === "all") ||
      doc.categories?.nom === selectedCategory
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const aField = a[sortField];
    const bField = b[sortField];
    if (aField < bField) return sortOrder === "asc" ? -1 : 1;
    if (aField > bField) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const confirmDelete = (document: any) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // 🔎 Extraire le chemin relatif depuis l'URL publique
      const filePath = documentToDelete.url.split("/storage/v1/object/public/documents/")[1];

      if (!filePath) {
        console.error("❌ Impossible de récupérer le chemin du fichier");
        toast.error("Impossible de récupérer le chemin du fichier");
        return;
      }

      // 1️⃣ Supprimer le fichier du bucket
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (storageError) {
        console.error("❌ Erreur suppression fichier storage :", storageError);
        toast.error("Erreur lors de la suppression du fichier");
        return;
      }

      // 2️⃣ Supprimer l'entrée dans la base de données
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (dbError) {
        console.error("❌ Erreur suppression document BDD :", dbError);
        toast.error("Erreur lors de la suppression de l'entrée en base de données");
        return;
      }

      // ✅ Mise à jour locale
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete.id));
      toast.success("Document supprimé avec succès !");
    } catch (err) {
      console.error("💥 Erreur inattendue :", err);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
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
                <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                <SelectItem value="Français">Français</SelectItem>
                <SelectItem value="Histoire">Histoire</SelectItem>
                <SelectItem value="Sciences">Sciences</SelectItem>
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

      {/* Grille */}
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

      {/* Aucune donnée */}
      {!loading && sortedDocuments.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="mx-auto h-10 w-10 mb-4" />
          <p>Aucun document trouvé.</p>
        </div>
      )}

      {/* Dialog de confirmation */}
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
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
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
