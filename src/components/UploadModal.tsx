
import React, { useState } from 'react';
import { Upload, Book, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UploadComponentProps {
  initialCategoryId?: string;
}

export const UploadComponent = ({ initialCategoryId }: UploadComponentProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategoryId || '');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-fill title based on filename (remove extension)
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Fichier manquant",
        description: "Veuillez sélectionner un fichier à télécharger.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: "Titre manquant",
        description: "Veuillez ajouter un titre pour votre document.",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    // Simulate upload
    setTimeout(() => {
      toast({
        title: "Document téléchargé",
        description: "Votre document a été téléchargé avec succès.",
      });
      setUploading(false);
      setFile(null);
      setTitle('');
      setCategory('');
    }, 1500);
  };

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <Card className="premium-card overflow-hidden">
        <CardHeader className="p-8 border-b bg-secondary/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-raleway font-medium">Importer un document</CardTitle>
          </div>
          <CardDescription className="text-base">
            Chargez vos documents pour les partager avec vos élèves ou les garder pour votre usage personnel.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-medium">Titre du document</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Entrez un titre descriptif"
                className="input-premium"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category" className="font-medium">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="input-premium">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Mathématiques</SelectItem>
                  <SelectItem value="physics">Physique</SelectItem>
                  <SelectItem value="history">Histoire</SelectItem>
                  <SelectItem value="literature">Littérature</SelectItem>
                  <SelectItem value="biology">Biologie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="file" className="font-medium">Fichier</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer">
                <Input 
                  id="file" 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.txt" 
                  onChange={handleFileChange}
                />
                <Label htmlFor="file" className="cursor-pointer w-full h-full block">
                  <div className="flex flex-col items-center gap-4">
                    {file ? (
                      <>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Déposez votre fichier ici ou cliquez pour parcourir</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            PDF, DOC, DOCX, TXT (max 10 MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Label>
              </div>
            </div>
          </CardContent>
        
          <CardFooter className="px-8 pb-8 pt-2 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto btn-premium order-1 sm:order-2"
              disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Book className="h-4 w-4 mr-2" />
                  Importer le document
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
