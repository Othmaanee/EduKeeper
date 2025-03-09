
import { Eye, Download, Clock, FileText, FileImage, FileVideo, FileAudio } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

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

type RecentDocumentCardProps = {
  document: Document;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    day: 'numeric', 
    month: 'short'
  }).format(date);
}

function RecentDocumentCard({ document }: RecentDocumentCardProps) {
  const Icon = iconMap[document.type];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 animate-fade-up hover:shadow-elevation transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="rounded-lg bg-secondary p-2.5 text-foreground">
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <Link to={`/documents/${document.id}`} className="hover:underline decoration-primary decoration-1 underline-offset-2">
            <h3 className="text-base font-medium truncate">{document.title}</h3>
          </Link>
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <Link 
              to={`/categories/${document.categoryId}`}
              className="inline-flex items-center hover:text-primary transition-colors"
            >
              {document.category}
            </Link>
            <span className="mx-2">•</span>
            <Clock className="h-3 w-3 mr-1" />
            {formatDate(document.date)}
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" className="h-8 px-2">
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 px-2">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-1 absolute bottom-0 left-0 right-0 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </div>
  );
}

export function RecentDocuments() {
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
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Documents récents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <RecentDocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}
