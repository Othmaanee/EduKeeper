
import React from 'react';
import { DocumentTable } from './DocumentTable';
import { EmptyDocumentState } from './EmptyDocumentState';

interface Document {
  id: string;
  nom: string;
  created_at: string;
  url: string;
  is_shared: boolean;
  category_id: string | null;
  user_id: string | null;
}

interface DocumentSectionProps {
  title: string;
  documents: Document[];
  isAIGenerated: (doc: Document) => boolean;
  onDownload: (doc: Document) => void;
  onShare: (docId: string) => void;
  onSelectDocToDelete: (docId: string) => void;
  onDelete: () => void;
  actionInProgress: string | null;
  showOnlyAIGenerated?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  showUploadButton?: boolean;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  title,
  documents,
  isAIGenerated,
  onDownload,
  onShare,
  onSelectDocToDelete,
  onDelete,
  actionInProgress,
  showOnlyAIGenerated = false,
  emptyTitle,
  emptyDescription,
  showUploadButton = true
}) => {
  const emptyState = (
    <EmptyDocumentState 
      title={emptyTitle} 
      description={emptyDescription}
      showUploadButton={showUploadButton}
    />
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <DocumentTable 
        documents={documents}
        isAIGenerated={isAIGenerated}
        onDownload={onDownload}
        onShare={onShare}
        onSelectDocToDelete={onSelectDocToDelete}
        onDelete={onDelete}
        actionInProgress={actionInProgress}
        showOnlyAIGenerated={showOnlyAIGenerated}
        emptyStateComponent={emptyState}
      />
    </div>
  );
};
