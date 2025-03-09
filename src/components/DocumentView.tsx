
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Download, Share, Clock, FileText, 
  Pencil, Trash, FolderOpen
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

export function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [category, setCategory] = useState('math');
  
  // Simulated document data
  const document = {
    id: id || '1',
    title: 'Cours de mathématiques - Statistiques',
    type: 'pdf',
    category: 'Mathématiques',
    categoryId: 'math',
    date: '2023-10-15',
    size: '2.4 MB',
    url: 'https://example.com/sample.pdf'
  };
  
  const categories = [
    { id: 'math', name: 'Mathématiques' },
    { id: 'french', name: 'Français' },
    { id: 'history', name: 'Histoire' },
    { id: 'science', name: 'Sciences' },
  ];

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  const handleDownload = () => {
    toast.success("Téléchargement démarré");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`https://yourdomain.com/documents/${id}`);
    toast.success("Lien copié dans le presse-papiers");
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    toast.success("Document supprimé");
    // Navigate back in a real app
  };

  const handleCategoryChange = () => {
    setShowCategoryDialog(false);
    toast.success("Catégorie mise à jour");
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header with navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/documents" className="flex items-center text-muted-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour aux documents
          </Link>
        </Button>
      </div>
      
      {/* Document header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{document.title}</h1>
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1.5" />
            <span>Importé le {formatDate(document.date)}</span>
            <span className="mx-2">•</span>
            <span>{document.size}</span>
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
      
      {/* Document preview */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
        <div className="p-4 bg-secondary border-b border-border flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            <span className="font-medium">Aperçu du document</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {document.category}
          </Badge>
        </div>
        
        <div className="p-8 flex items-center justify-center min-h-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAyMGMwIDExLjA0Ni04Ljk1NCAyMC0yMCAyMHMtMjAtOC45NTQtMjAtMjAgOC45NTQtMjAgMjAtMjAgMjAgOC45NTQgMjAgMjB6bS0yMCAyYy0xMC40OTMgMC0xOS0zLjEzNC0xOS03cy44MzMtNyAxOS03IDE5IDMuMTM0IDE5IDctOC41MDcgNy0xOSA3eiIgZmlsbD0iI2YxZjVmOSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PC9nPjwvc3ZnPg==')]">
          {document.type === 'pdf' && (
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Prévisualisation PDF non disponible.
                <br />
                <Button variant="link" className="mt-2" onClick={handleDownload}>
                  Télécharger pour voir le contenu
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-secondary/50 border border-border rounded-lg p-4">
        <h3 className="font-medium mb-4">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier la catégorie
          </Button>
          <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteDialog(true)}>
            <Trash className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
      
      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Dialog */}
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
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCategoryChange}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
