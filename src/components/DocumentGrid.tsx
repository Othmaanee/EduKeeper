
import { useState } from 'react';
import { 
  FileText, FileImage, FileVideo, FileAudio, List, Grid,
  MoreVertical, Eye, Download, Pencil, Trash, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';

type Document = {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'img' | 'video' | 'audio';
  category: string;
  categoryId: string;
  date: string;
};

const iconMap = {
  pdf: FileText,
  doc: FileText,
  img: FileImage,
  video: FileVideo,
  audio: FileAudio,
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }).format(date);
}

export function DocumentGrid() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // This would typically come from an API
  const documents: Document[] = [
    { 
      id: '1', 
      title: 'Cours de mathématiques - Statistiques', 
      type: 'pdf',
      category: 'Mathématiques',
      categoryId: 'math',
      date: '2023-10-15' 
    },
    { 
      id: '2', 
      title: 'Exercices de grammaire française', 
      type: 'doc',
      category: 'Français',
      categoryId: 'french',
      date: '2023-10-14' 
    },
    { 
      id: '3', 
      title: 'Vidéo - Introduction à la physique quantique', 
      type: 'video',
      category: 'Physique',
      categoryId: 'physics',
      date: '2023-10-10' 
    },
    { 
      id: '4', 
      title: 'Audio - Conversation anglais niveau B2', 
      type: 'audio',
      category: 'Langues',
      categoryId: 'languages',
      date: '2023-10-05' 
    },
    { 
      id: '5', 
      title: 'Fiches de révision - Philosophie', 
      type: 'pdf',
      category: 'Philosophie',
      categoryId: 'philosophy',
      date: '2023-09-28' 
    },
    { 
      id: '6', 
      title: 'Images - Schémas de biologie', 
      type: 'img',
      category: 'Biologie',
      categoryId: 'biology',
      date: '2023-09-20' 
    },
  ];

  function DocumentGridView() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((doc) => {
          const Icon = iconMap[doc.type];
          
          return (
            <Card 
              key={doc.id}
              className="group overflow-hidden animate-scale-in hover:shadow-elevation transition-all duration-300"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-secondary text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>Voir</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Télécharger</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Renommer</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-4">
                  <Link 
                    to={`/documents/${doc.id}`}
                    className="hover:underline decoration-primary decoration-1 underline-offset-2"
                  >
                    <h3 className="font-medium text-base">{doc.title}</h3>
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className="text-xs font-normal hover:bg-secondary"
                      asChild
                    >
                      <Link to={`/categories/${doc.categoryId}`}>
                        {doc.category}
                      </Link>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.date)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="h-1 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Card>
          );
        })}
      </div>
    );
  }

  function DocumentListView() {
    return (
      <div className="space-y-2 animate-fade-in">
        {documents.map((doc) => {
          const Icon = iconMap[doc.type];
          
          return (
            <div 
              key={doc.id}
              className="group flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors duration-200"
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="p-2 rounded-md bg-secondary text-foreground mr-3">
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="min-w-0">
                  <Link 
                    to={`/documents/${doc.id}`}
                    className="font-medium text-sm hover:text-primary transition-colors"
                  >
                    <h3 className="truncate">{doc.title}</h3>
                  </Link>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                    <Link 
                      to={`/categories/${doc.categoryId}`}
                      className="hover:text-primary transition-colors"
                    >
                      {doc.category}
                    </Link>
                    <span className="mx-2">•</span>
                    <span>{formatDate(doc.date)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Renommer</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Supprimer</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
          
          <div className="flex items-center bg-secondary rounded-md p-0.5">
            <Button 
              size="sm" 
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className={cn(
                "h-8 w-8 p-0",
                viewMode === 'grid' ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className={cn(
                "h-8 w-8 p-0",
                viewMode === 'list' ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {viewMode === 'grid' ? <DocumentGridView /> : <DocumentListView />}
    </div>
  );
}
