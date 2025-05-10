
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  nom: string;
  created_at: string;
  url: string;
  is_shared: boolean;
  category_id: string | null;
  user_id: string | null;
}

interface Stats {
  totalDocuments: number;
  sharedDocuments: number;
  latestDocument: Document | null;
}

export const useDocumentManagement = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    sharedDocuments: 0,
    latestDocument: null,
  });
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAIGenerated = (doc: Document) => {
    return doc.nom.startsWith('Cours :');
  };

  useEffect(() => {
    fetchDocuments();
  }, [navigate, toast]);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error("Error fetching user role:", userError);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier votre rôle: " + userError.message,
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      
      if (!userData || userData.role !== 'enseignant') {
        toast({
          title: "Accès refusé",
          description: "Cette page est réservée aux enseignants.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('id, nom, url, created_at, user_id, category_id, is_shared')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setDocuments(data);
        
        const aiDocs = data.filter(doc => isAIGenerated(doc));
        
        const totalAIDocs = aiDocs.length;
        const sharedDocs = data.filter(doc => doc.is_shared).length;
        const latestAIDoc = aiDocs.length > 0 ? aiDocs[0] : null;
        
        setStats({
          totalDocuments: totalAIDocs,
          sharedDocuments: sharedDocs,
          latestDocument: latestAIDoc,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos documents: " + error.message,
        variant: "destructive",
      });
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareDocument = async (docId: string) => {
    try {
      setActionInProgress(docId);
      
      const { data, error } = await supabase
        .from('documents')
        .update({ is_shared: true })
        .eq('id', docId)
        .select();
      
      if (error) throw error;
      
      setDocuments(docs => docs.map(doc => 
        doc.id === docId ? { ...doc, is_shared: true } : doc
      ));
      
      setStats(prev => ({
        ...prev,
        sharedDocuments: prev.sharedDocuments + 1
      }));
      
      toast({
        title: "Document partagé",
        description: "Le document est maintenant partagé avec vos élèves.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de partager le document: " + error.message,
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      setActionInProgress(documentToDelete);
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentToDelete);
      
      if (error) throw error;
      
      const deletedDoc = documents.find(doc => doc.id === documentToDelete);
      const wasShared = deletedDoc?.is_shared || false;
      const wasAIGenerated = deletedDoc ? isAIGenerated(deletedDoc) : false;
      
      setDocuments(docs => docs.filter(doc => doc.id !== documentToDelete));
      
      if (wasAIGenerated) {
        setStats(prev => ({
          ...prev,
          totalDocuments: prev.totalDocuments - 1,
          sharedDocuments: wasShared ? prev.sharedDocuments - 1 : prev.sharedDocuments,
          latestDocument: prev.latestDocument?.id === documentToDelete 
            ? documents.filter(d => d.id !== documentToDelete && isAIGenerated(d))[0] || null
            : prev.latestDocument
        }));
      }

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      if (userId && deletedDoc) {
        console.log("📝 Tentative d'ajout dans l'historique: suppression -", deletedDoc.nom);
        
        const { error: historyError } = await supabase
          .from('history')
          .insert([{
            user_id: userId,
            action_type: 'suppression',
            document_name: deletedDoc.nom,
          }]);
        
        if (historyError) {
          console.error("❌ Erreur lors de l'insertion dans l'historique:", historyError.message);
          console.error("Détails de l'erreur:", historyError);
        } else {
          console.log("✅ Action 'suppression' ajoutée à l'historique avec succès");
        }
      }
      
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document: " + error.message,
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
      setDocumentToDelete(null);
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    window.open(doc.url, '_blank');
  };

  return {
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
  };
};
