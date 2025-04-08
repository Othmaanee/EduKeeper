
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export function DocumentUploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        const { data, error } = await supabase
          .from('categories')
          .select('id, nom')
          .eq('user_id', session.user.id);
        
        if (error) {
          throw error;
        }
        
        setCategories(data || []);
        
        // Check if there's an initialCategoryId from the window object
        if (window.initialUploadCategoryId) {
          setSelectedCategory(window.initialUploadCategoryId);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les catégories.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, [toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      
      // Set default document name from file name (without extension)
      const fileNameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, "");
      setDocumentName(fileNameWithoutExtension);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!file) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier à importer.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!documentName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez donner un nom à votre document.',
        variant: 'destructive',
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Veuillez vous connecter pour importer un document');
      }
      
      // Generate a unique filename using user ID and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      // Save document info in the database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([
          { 
            nom: documentName,
            url: publicUrl,
            user_id: session.user.id,
            category_id: selectedCategory,
          }
        ])
        .select();
      
      if (docError) {
        throw docError;
      }
      
      // Log the action in history
      const { error: historyError } = await supabase
        .from('history')
        .insert([
          {
            user_id: session.user.id,
            action_type: 'import',
            document_name: documentName,
          }
        ]);
      
      if (historyError) {
        console.error('Erreur lors de l\'ajout à l\'historique:', historyError);
      }
      
      toast({
        description: 'Document importé avec succès !',
      });
      
      // Reset form
      setFile(null);
      setDocumentName('');
      setSelectedCategory(null);
      
      // Close modal on success
      onSuccess();
    } catch (error: any) {
      console.error('Erreur lors de l\'importation:', error);
      toast({
        title: 'Erreur',
        description: `Impossible d'importer le document: ${error.message || error}`,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="document">Fichier</Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            id="document"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.md"
            disabled={uploading}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Formats acceptés: PDF, DOC, DOCX, TXT, MD
        </p>
      </div>
      
      <div>
        <Label htmlFor="name">Nom du document</Label>
        <Input
          id="name"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          placeholder="Nom du document"
          disabled={uploading}
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="category">Catégorie (optionnel)</Label>
        <Select
          value={selectedCategory || ''}
          onValueChange={(value) => setSelectedCategory(value || null)}
          disabled={uploading || loadingCategories}
        >
          <SelectTrigger className="mt-1">
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
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={uploading || !file}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importation...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
