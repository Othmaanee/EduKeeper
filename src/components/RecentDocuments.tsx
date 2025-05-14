import { useState, useEffect } from 'react';
import { Eye, Download, Clock, FileText, FileImage, FileVideo, FileAudio, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type SupabaseDocument = {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'img' | 'video' | 'audio';
  category: string;
  categoryId: string;
  date: string;
  url: string;
};

const iconMap = {
  pdf: FileText,
  doc: FileText,
  img: FileImage,
  video: FileVideo,
  audio: FileAudio,
};

type RecentDocumentCardProps = {
  document: SupabaseDocument;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    day: 'numeric', 
    month: 'short'
  }).format(date);
}

// Helper function to determine document type based on filename
function getDocumentType(filename: string): 'pdf' | 'doc' | 'img' | 'video' | 'audio' {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (!extension) return 'doc';
  
  if (['pdf'].includes(extension)) return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'doc';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'img';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) return 'video';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) return 'audio';
  
  return 'doc';
}

function RecentDocumentCard({ document }: RecentDocumentCardProps) {
  const Icon = iconMap[document.type];

  const handleViewDocument = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

  const handleDownload = (url: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const link = window.document.createElement("a");
      link.href = url;
      link.download = title;
      link.target = "_blank";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur lors du téléchargement", error);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 animate-fade-up hover:shadow-elevation transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="rounded-lg bg-secondary p-2.5 text-foreground">
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <Link 
            to={`/documents/${document.id}`}
            onClick={(e) => handleViewDocument(document.url, e)}
            className="hover:underline decoration-primary decoration-1 underline-offset-2"
          >
            <h3 className="text-base font-medium truncate">{document.title}</h3>
          </Link>
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <Link 
              to={`/documents?category_id=${document.categoryId}`}
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
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 px-2"
          onClick={(e) => handleViewDocument(document.url, e)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 px-2"
          onClick={(e) => handleDownload(document.url, document.title, e)}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-1 absolute bottom-0 left-0 right-0 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </div>
  );
}

export function RecentDocuments() {
  // Fetch recent documents from Supabase
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['recentDocuments'],
    queryFn: async () => {
      try {
        // Get current user's role to determine what documents to fetch
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("RecentDocuments: Utilisateur non connecté");
          return [];
        }
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (userError) {
          console.error("RecentDocuments: Erreur de récupération du rôle utilisateur", userError);
          return [];
        }
        
        // Query documents based on user role
        let query = supabase
          .from('documents')
          .select('*, categories(id, nom)')
          .order('created_at', { ascending: false })
          .limit(6);
        
        // For regular users, only show their documents and shared documents
        if (userData.role === 'user') {
          query = query.or(`user_id.eq.${session.user.id},is_shared.eq.true`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("RecentDocuments: Erreur de récupération des documents", error);
          return [];
        }
        
        // Transform data to match SupabaseDocument type
        return (data || []).map(doc => ({
          id: doc.id,
          title: doc.nom,
          type: getDocumentType(doc.nom),
          category: doc.categories?.nom || 'Sans catégorie',
          categoryId: doc.category_id || '',
          date: doc.created_at,
          url: doc.url
        }));
      } catch (err) {
        console.error("RecentDocuments: Exception lors de la récupération", err);
        throw err;
      }
    },
    // Désactiver le rechargement automatique
    staleTime: 1000 * 60 * 5, // Donées considérées fraîches pendant 5 minutes
    retry: 1, // Limiter à une nouvelle tentative en cas d'échec
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Documents récents</h2>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || documents.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Documents récents</h2>
        <div className="text-center text-muted-foreground py-8">
          <FileText className="mx-auto h-10 w-10 mb-4" />
          <p>{error ? "Erreur lors du chargement des documents récents." : "Aucun document récent."}</p>
        </div>
      </div>
    );
  }

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
