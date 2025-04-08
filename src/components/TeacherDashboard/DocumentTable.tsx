
import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentActions } from './DocumentActions';

interface Document {
  id: string;
  nom: string;
  created_at: string;
  url: string;
  is_shared: boolean;
  category_id: string | null;
  user_id: string | null;
}

interface DocumentTableProps {
  documents: Document[];
  isAIGenerated: (doc: Document) => boolean;
  onDownload: (doc: Document) => void;
  onShare: (docId: string) => void;
  onSelectDocToDelete: (docId: string) => void;
  onDelete: () => void;
  actionInProgress: string | null;
  showOnlyAIGenerated?: boolean;
  emptyStateComponent: React.ReactNode;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  isAIGenerated,
  onDownload,
  onShare,
  onSelectDocToDelete,
  onDelete,
  actionInProgress,
  showOnlyAIGenerated = false,
  emptyStateComponent
}) => {
  const filteredDocs = showOnlyAIGenerated 
    ? documents.filter(doc => isAIGenerated(doc))
    : documents;

  if (filteredDocs.length === 0) {
    return <>{emptyStateComponent}</>;
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead className="hidden md:table-cell">Date de création</TableHead>
            <TableHead className="hidden md:table-cell">Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocs.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div>
                    <span className="truncate max-w-[180px] md:max-w-xs block">
                      {doc.nom}
                    </span>
                    {isAIGenerated(doc) && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs font-normal flex items-center mt-1 w-fit">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Généré IA
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {format(new Date(doc.created_at), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {doc.is_shared ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                    Partagé
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Non partagé
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DocumentActions 
                  docId={doc.id}
                  docName={doc.nom}
                  docUrl={doc.url} // Pass the url to DocumentActions
                  isShared={doc.is_shared}
                  onDownload={() => onDownload(doc)}
                  onShare={() => onShare(doc.id)}
                  onDelete={onDelete}
                  actionInProgress={actionInProgress}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
