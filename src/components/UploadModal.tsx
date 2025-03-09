
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, X, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

type UploadFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
};

export function UploadComponent() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [category, setCategory] = useState('');
  const [newCategoryDialog, setNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'math', name: 'Mathématiques' },
    { id: 'french', name: 'Français' },
    { id: 'history', name: 'Histoire' },
    { id: 'science', name: 'Sciences' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      progress: 0,
    }));
    
    setFiles((prev) => [...prev, ...newFiles]);
    
    // Simulate upload progress
    newFiles.forEach((file) => {
      simulateUploadProgress(file.id);
    });
  };

  const simulateUploadProgress = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setTimeout(() => {
          toast.success(`Le fichier a été importé avec succès.`);
        }, 500);
      }
      
      setFiles((prev) => 
        prev.map((file) => 
          file.id === fileId ? { ...file, progress } : file
        )
      );
    }, 300);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      // Here you would normally send this to your backend
      toast.success(`Catégorie "${newCategoryName}" créée avec succès`);
      setNewCategoryDialog(false);
      setNewCategoryName('');
      // For demo purposes, we'll just set the category
      setCategory('new-category');
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Importer des documents</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Importez vos documents éducatifs pour les organiser facilement. Formats supportés: PDF, DOCX, PPTX, MP4, MP3, PNG, JPG.
        </p>
      </div>
      
      {/* Category Selection */}
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
      
      {/* Upload Area */}
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
          <Upload className={cn(
            "h-10 w-10 mx-auto mb-4 transition-colors",
            dragActive ? "text-primary" : "text-muted-foreground"
          )} />
          
          <h3 className="text-lg font-medium">
            {dragActive 
              ? "Déposez vos fichiers ici" 
              : "Glissez-déposez vos fichiers ici"}
          </h3>
          
          <p className="mt-2 text-sm text-muted-foreground">
            ou
          </p>
          
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => inputRef.current?.click()}
          >
            Parcourir vos fichiers
          </Button>
          
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
        </div>
      </div>
      
      {/* File List */}
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
                  <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Progress value={file.progress} className="h-2" />
                  <span className="text-xs font-medium text-muted-foreground w-10">
                    {file.progress}%
                  </span>
                </div>
                
                <Button
                  variant="ghost" 
                  size="icon"
                  className="absolute top-3 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* New Category Dialog */}
      <Dialog open={newCategoryDialog} onOpenChange={setNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle catégorie pour organiser vos documents.
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
              placeholder="Ex: Chimie, Géographie..."
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCategory}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
