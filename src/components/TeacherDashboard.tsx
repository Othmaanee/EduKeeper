
import React, { useState } from 'react';
import { Loader2, Filter, X } from 'lucide-react';
import { StatsCards } from './TeacherDashboard/StatsCards';
import { DocumentSection } from './TeacherDashboard/DocumentSection';
import { useDocumentManagement } from './TeacherDashboard/useDocumentManagement';
import { SearchBar } from './SearchBar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [filterShared, setFilterShared] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    // Search filter
    const matchesSearch = doc.nom.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Shared status filter
    const matchesShared = filterShared === null || 
      (filterShared === 'shared' && doc.is_shared) || 
      (filterShared === 'personal' && !doc.is_shared);
    
    return matchesSearch && matchesShared;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return a.nom.localeCompare(b.nom);
      case 'title-desc':
        return b.nom.localeCompare(a.nom);
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'date-desc':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('date-desc');
    setFilterShared(null);
  };

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
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <SearchBar onSearch={setSearchQuery} value={searchQuery} />
          
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (récent d'abord)</SelectItem>
                <SelectItem value="date-asc">Date (ancien d'abord)</SelectItem>
                <SelectItem value="title-asc">Titre (A-Z)</SelectItem>
                <SelectItem value="title-desc">Titre (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
              <DropdownMenuTrigger asChild onClick={() => setFilterOpen(true)}>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  <span>Filtres</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-background" align="end">
                <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    className={filterShared === null ? "bg-accent text-accent-foreground" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setFilterShared(null);
                      // Don't close dropdown when clicking item
                    }}
                  >
                    Tous
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={filterShared === 'shared' ? "bg-accent text-accent-foreground" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setFilterShared('shared');
                      // Don't close dropdown when clicking item
                    }}
                  >
                    Partagés
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={filterShared === 'personal' ? "bg-accent text-accent-foreground" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setFilterShared('personal');
                      // Don't close dropdown when clicking item
                    }}
                  >
                    Personnel
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(searchQuery !== '' || sortBy !== 'date-desc' || filterShared !== null) && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
        
        <DocumentSection
          title="Mes documents générés"
          documents={sortedDocuments}
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
          documents={sortedDocuments}
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
