
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, FolderPlus, Trash, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

type UploadFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  supabaseId?: string; // Added to store the Supabase document ID
};

type UploadComponentProps = {
  initialCategoryId?: string | null;
};

export function UploadComponent({ initialCategoryId }: UploadComponentProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [newCategoryDialog, setNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  // Set the initial category when the component mounts or initialCategoryId changes
  useEffect(() => {
    if (initialCategoryId) {
      setCategory(initialCategoryId);
    }
  }, [initialCategoryId]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("categories")
        .select("id, nom")
        .eq("user_id", userId);

      if (error) {
        console.error("❌ Erreur chargement catégories :", error);
      } else {
        setCategories(data.map((cat) => ({ id: cat.id, name: cat.nom })));
      }
    };

    fetchCategories();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Fonction pour nettoyer le nom de fichier et ajouter un identifiant unique
  const cleanFileName = (fileName: string): string => {
    // Récupérer l'extension du fichier
    const extension = fileName.split('.').pop() || '';
    
    // Récupérer le nom sans extension
    const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
    
    // Nettoyer le nom: supprimer les caractères spéciaux et espaces
    const cleanName = nameWithoutExtension
      .normalize('NFD') // décomposer les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // supprimer les accents
      .replace(/[^a-zA-Z0-9]/g, '-') // remplacer les caractères spéciaux par des tirets
      .replace(/-+/g, '-') // remplacer les séquences de tirets par un seul tiret
      .replace(/^-|-$/g, '') // supprimer les tirets au début et à la fin
      .toLowerCase();
    
    // Ajouter un timestamp unique
    const uniqueId = Date.now().toString();
    
    // Retourner le nom nettoyé avec l'ID unique et l'extension
    return `${cleanName}-${uniqueId}.${extension}`;
  };

  const uploadFileToSupabase = async (file: File, fileId: string) => {
    const { data: session } = await supabase.auth.getSession();
    console.log("Session actuelle :", session);

    if (!session || !session.session || !session.session.user) {
      console.error("❌ Aucun utilisateur connecté !");
      toast.error("Vous devez être connecté pour uploader un fichier.");
      return;
    }

    const user = session.session.user;
    console.log("✅ Utilisateur connecté :", user);

    console.log("Tentative d'upload du fichier :", file);
    if (!file) {
      console.error("❌ Aucun fichier détecté !");
      return;
    }

    try {
      // Nettoyage du nom du fichier et ajout d'un identifiant unique
      const cleanedFileName = cleanFileName(file.name);
      console.log(`Nom de fichier nettoyé: ${cleanedFileName}`);
      
      const filePath = `public/${cleanedFileName}`;
      
      // Vérifier si un fichier avec le même nom existe déjà
      const { data: existingFiles } = await supabase.storage
        .from("documents")
        .list("public", {
          search: cleanedFileName
        });
      
      if (existingFiles && existingFiles.length > 0) {
        console.log("Fichier existant trouvé, suppression avant réupload:", existingFiles);
        const existingPath = `public/${existingFiles[0].name}`;
        await supabase.storage.from("documents").remove([existingPath]);
        console.log("Ancien fichier supprimé:", existingPath);
      }

      // Upload du fichier avec le nom nettoyé
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("❌ Erreur d'upload :", uploadError);
        toast.error(`Échec de l'upload : ${uploadError.message}`);
        return;
      }

      console.log("✅ Fichier uploadé avec succès :", uploadData);

      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      const { data: documentData, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            nom: file.name, // Garder le nom original dans la base de données pour l'affichage
            url: publicUrl,
            category_id: category || null,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error(
          "❌ Erreur d'insertion dans la base :",
          insertError.message
        );
        toast.error(`Échec de l'enregistrement : ${insertError.message}`);
        return;
      }

      // Ajouter une entrée dans l'historique pour l'import du document
      const { error: historyError } = await supabase
        .from('history')
        .insert([
          {
            user_id: user.id,
            action_type: 'import',
            document_name: file.name,
          }
        ]);
      
      if (historyError) {
        console.error("❌ Erreur lors de l'insertion dans l'historique:", historyError.message);
      } else {
        console.log("✅ Action 'import' ajoutée à l'historique");
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress: 100, supabaseId: documentData.id }
            : f
        )
      );

      console.log("✅ Document inséré dans la base !", documentData);
      toast.success("Fichier importé avec succès !");
    } catch (error: any) {
      console.error("❌ Erreur lors de l'upload :", error);
      toast.error(`Une erreur est survenue : ${error.message}`);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles = Array.from(fileList).map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fileId = newFiles[i].id;
      
      simulateUploadProgress(fileId);
      
      await uploadFileToSupabase(file, fileId);
    }
  };

  const simulateUploadProgress = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 1;
      if (progress >= 95) {
        progress = 95;
        clearInterval(interval);
      }

      setFiles((prev) =>
        prev.map((file) => (file.id === fileId ? { ...file, progress } : file))
      );
    }, 300);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const confirmDelete = (file: UploadFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (!userId) {
        toast.error("Vous devez être connecté pour supprimer un fichier.");
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        return;
      }
      
      let documentToDelete;
      
      if (fileToDelete.supabaseId) {
        const { data: document, error: fetchError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", fileToDelete.supabaseId)
          .single();
        
        if (fetchError) {
          console.error("❌ Error fetching document details:", fetchError);
        } else {
          documentToDelete = document;
        }
      } 
      
      if (!documentToDelete) {
        const { data: documentByName, error: nameError } = await supabase
          .from("documents")
          .select("*")
          .eq("nom", fileToDelete.name)
          .eq("user_id", userId)
          .maybeSingle();
        
        if (!nameError && documentByName) {
          documentToDelete = documentByName;
        }
      }

      if (!documentToDelete) {
        console.error("❌ Could not find document to delete in the database");
        toast.error("Impossible de trouver le document dans la base de données");
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        return;
      }
      
      const storageFilePath = documentToDelete.url.split('/').slice(-2).join('/');
      const bucketName = storageFilePath.split('/')[0];
      const objectPath = storageFilePath.split('/').slice(1).join('/');
      
      console.log("🗑️ Deleting from storage:", bucketName, objectPath);
      
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([objectPath]);
        
      if (storageError) {
        console.error("❌ Error deleting from storage:", storageError);
        toast.error(`Erreur lors de la suppression du fichier: ${storageError.message}`);
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        return;
      }
      
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);
      
      if (dbError) {
        console.error("❌ Error deleting from database:", dbError);
        toast.error(`Le fichier a été supprimé du stockage mais pas de la base de données: ${dbError.message}`);
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        return;
      }

      // Ajouter une entrée dans l'historique pour la suppression du document
      const { error: historyError } = await supabase
        .from('history')
        .insert([
          {
            user_id: userId,
            action_type: 'suppression',
            document_name: documentToDelete.nom,
          }
        ]);
      
      if (historyError) {
        console.error("❌ Erreur lors de l'insertion dans l'historique:", historyError.message);
      } else {
        console.log("✅ Action 'suppression' ajoutée à l'historique");
      }
      
      setFiles((prev) => prev.filter(file => file.id !== fileToDelete.id));
      toast.success("Document supprimé avec succès");
    } catch (error: any) {
      console.error("❌ Unexpected error during deletion:", error);
      toast.error(`Erreur inattendue lors de la suppression: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return;

    const { data: insertedCategory, error: insertError } = await supabase
      .from("categories")
      .insert([{ nom: newCategoryName, user_id: userId }])
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erreur insertion catégorie :", insertError);
      toast.error("Erreur lors de la création.");
      return;
    }

    const { error: linkError } = await supabase.from("user_categories").insert([
      {
        user_id: userId,
        category_id: insertedCategory.id,
      },
    ]);

    if (linkError) {
      console.error("❌ Erreur liaison user/catégorie :", linkError);
      toast.error("Erreur lors de l'association utilisateur.");
      return;
    }

    setCategories((prev) => [
      ...prev,
      { id: insertedCategory.id, name: newCategoryName },
    ]);
    setCategory(insertedCategory.id);

    toast.success(`Catégorie "${newCategoryName}" créée avec succès`);
    setNewCategoryDialog(false);
    setNewCategoryName("");
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Importer des documents
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Importez vos documents éducatifs pour les organiser facilement.
          Formats supportés: PDF, DOCX, PPTX, MP4, MP3, PNG, JPG.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium mb-2">
          Sélectionner une catégorie
        </label>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="icon"
            variant="outline"
            onClick={() => setNewCategoryDialog(true)}
            title="Créer une nouvelle catégorie"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "max-w-3xl mx-auto border-2 border-dashed rounded-xl p-8",
          "transition-all duration-200 ease-in-out animate-fade-in",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/50"
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload
            className={cn(
              "h-10 w-10 mx-auto mb-4 transition-colors",
              dragActive ? "text-primary" : "text-muted-foreground"
            )}
          />

          <h3 className="text-lg font-medium">
            {dragActive
              ? "Déposez vos fichiers ici"
              : "Glissez-déposez vos fichiers ici"}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">ou</p>

          <Button
            variant="outline"
            className="mt-4"
            onClick={() => inputRef.current?.click()}
          >
            Parcourir vos fichiers
          </Button>

          <label htmlFor="file-upload" className="sr-only">
            Choisissez un fichier à uploader
          </label>
          <input
            id="file-upload"
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-4 animate-fade-up">
          <h3 className="text-lg font-medium">Fichiers ({files.length})</h3>

          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative bg-card rounded-lg border border-border p-4 pr-10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium truncate pr-4">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Progress value={file.progress} className="h-2" />
                  <span className="text-xs font-medium text-muted-foreground w-10">
                    {file.progress}%
                  </span>
                </div>

                <div className="absolute top-3 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => confirmDelete(file)}
                    title="Supprimer ce fichier"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-muted-foreground/70"
                    onClick={() => removeFile(file.id)}
                    title="Retirer de la liste"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={newCategoryDialog} onOpenChange={setNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle catégorie pour organiser vos documents.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label
              className="block text-sm font-medium mb-2"
              htmlFor="category-name"
            >
              Nom de la catégorie
            </label>
            <Input
              id="category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateCategory();
                }
              }}
              placeholder="Ex: Mathématiques, Français, Histoire..."
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewCategoryDialog(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateCategory}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFile}
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
