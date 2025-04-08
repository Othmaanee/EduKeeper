
import React from 'react';
import { Loader2 } from 'lucide-react';
import { StatsCards } from './TeacherDashboard/StatsCards';
import { DocumentSection } from './TeacherDashboard/DocumentSection';
import { useDocumentManagement } from './TeacherDashboard/useDocumentManagement';

interface Document {
  id: string;
  nom: string;
  created_at: string;
  url: string;
  is_shared: boolean;
  category_id: string | null;
  user_id: string | null;
}

export function TeacherDashboard() {
  const {
    documents,
    loading,
    stats,
    documentToDelete,
    actionInProgress,
    isAIGenerated,
    handleShareDocument,
    handleDeleteDocument,
    handleDownloadDocument,
    setDocumentToDelete
  } = useDocumentManagement();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenue dans votre espace Enseignant</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos cours et partagez-les avec vos élèves
          </p>
        </div>

        <StatsCards 
          totalDocuments={stats.totalDocuments}
          sharedDocuments={stats.sharedDocuments}
          latestDocument={stats.latestDocument}
        />
        
        <DocumentSection
          title="Mes documents générés"
          documents={documents}
          isAIGenerated={isAIGenerated}
          onDownload={handleDownloadDocument}
          onShare={handleShareDocument}
          onSelectDocToDelete={setDocumentToDelete}
          onDelete={handleDeleteDocument}
          actionInProgress={actionInProgress}
          showOnlyAIGenerated={true}
          emptyTitle="Aucun document généré"
          emptyDescription="Vous n'avez pas encore généré de documents avec l'IA."
          showUploadButton={false}
        />
        
        <DocumentSection
          title="Tous mes documents"
          documents={documents}
          isAIGenerated={isAIGenerated}
          onDownload={handleDownloadDocument}
          onShare={handleShareDocument}
          onSelectDocToDelete={setDocumentToDelete}
          onDelete={handleDeleteDocument}
          actionInProgress={actionInProgress}
          showOnlyAIGenerated={false}
          emptyTitle="Aucun document"
          emptyDescription="Vous n'avez pas encore de documents."
          showUploadButton={true}
        />
      </div>
    </div>
  );
}
