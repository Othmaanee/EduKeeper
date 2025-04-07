
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Share2, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    sharedDocuments: 0,
    latestDocument: null as Document | null,
  });
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if a document is AI-generated based on its name
  const isAIGenerated = (docName: string): boolean => {
    return docName.startsWith("Cours :");
  };

  // Fetch user documents
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Get user role to check if they're a teacher
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

        // Fetch documents for the logged in user, including is_shared field
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
          
          // Filter AI-generated documents
          const aiGeneratedDocs = data.filter(doc => isAIGenerated(doc.nom));
          
          // Calculate stats for AI-generated documents only
          const totalAIDocs = aiGeneratedDocs.length;
          const sharedAIDocs = aiGeneratedDocs.filter(doc => doc.is_shared).length;
          const latestAIDoc = aiGeneratedDocs.length > 0 ? aiGeneratedDocs[0] : null;
          
          setStats({
            totalDocuments: totalAIDocs,
            sharedDocuments: sharedAIDocs,
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
    }

    fetchDocuments();
  }, [navigate, toast]);

  // Handle document sharing
  const handleShareDocument = async (docId: string) => {
    try {
      setActionInProgress(docId);
      
      const { data, error } = await supabase
        .from('documents')
        .update({ is_shared: true })
        .eq('id', docId)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setDocuments(docs => docs.map(doc => 
        doc.id === docId ? { ...doc, is_shared: true } : doc
      ));
      
      // Update stats if it's an AI-generated document
      const doc = documents.find(d => d.id === docId);
      if (doc && isAIGenerated(doc.nom)) {
        setStats(prev => ({
          ...prev,
          sharedDocuments: prev.sharedDocuments + 1
        }));
      }
      
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

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      setActionInProgress(documentToDelete);
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentToDelete);
      
      if (error) throw error;
      
      // Update local state
      const deletedDoc = documents.find(doc => doc.id === documentToDelete);
      
      // Check if the deleted document was an AI-generated one
      if (deletedDoc && isAIGenerated(deletedDoc.nom)) {
        const wasShared = deletedDoc.is_shared || false;
        
        // Update stats for AI-generated documents
        setStats(prev => ({
          ...prev,
          totalDocuments: prev.totalDocuments - 1,
          sharedDocuments: wasShared ? prev.sharedDocuments - 1 : prev.sharedDocuments,
          latestDocument: prev.latestDocument?.id === documentToDelete 
            ? documents.filter(doc => isAIGenerated(doc.nom) && doc.id !== documentToDelete)[0] || null 
            : prev.latestDocument
        }));
      }
      
      // Remove from documents list
      setDocuments(docs => docs.filter(doc => doc.id !== documentToDelete));
      
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

  // Handle document download
  const handleDownloadDocument = (doc: Document) => {
    window.open(doc.url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Chargement...</span>
      </div>
    );
  }

  // Filter AI-generated documents for the UI display
  const aiGeneratedDocs = documents.filter(doc => isAIGenerated(doc.nom));

  return (
    <div className="container py-8">
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenue dans votre espace Enseignant</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos cours et partagez-les avec vos élèves
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{stats.totalDocuments}</CardTitle>
              <CardDescription>Documents générés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{stats.sharedDocuments}</CardTitle>
              <CardDescription>Cours partagés</CardDescription>
            </CardHeader>
            <CardContent>
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl truncate">
                {stats.latestDocument ? stats.latestDocument.nom : "Aucun document"}
              </CardTitle>
              <CardDescription>Dernier cours généré</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.latestDocument && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(stats.latestDocument.created_at), 'dd MMMM yyyy', { locale: fr })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Mes documents générés par IA</h2>
          
          {aiGeneratedDocs.length === 0 ? (
            <div className="text-center p-8 bg-muted/30 rounded-lg border border-dashed">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium">Aucun document généré</h3>
              <p className="text-muted-foreground mt-1">
                Vous n'avez pas encore généré de documents avec l'IA.
              </p>
              <Button className="mt-4" onClick={() => navigate('/generate')}>
                Générer un cours
              </Button>
            </div>
          ) : (
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
                  {aiGeneratedDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="truncate max-w-[180px] md:max-w-xs">
                              {doc.nom}
                            </span>
                            <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit bg-amber-50 border-amber-200 text-amber-700 mt-1">
                              <Sparkles className="h-3 w-3" /> Généré IA
                            </Badge>
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {!doc.is_shared && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleShareDocument(doc.id)}
                              disabled={actionInProgress === doc.id}
                              title="Partager"
                            >
                              {actionInProgress === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Share2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDocumentToDelete(doc.id)}
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmer la suppression</DialogTitle>
                                <DialogDescription>
                                  Êtes-vous sûr de vouloir supprimer le document "{doc.nom}" ?
                                  Cette action est irréversible.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Annuler</Button>
                                </DialogClose>
                                <Button 
                                  variant="destructive" 
                                  onClick={handleDeleteDocument}
                                  disabled={actionInProgress === doc.id}
                                >
                                  {actionInProgress === doc.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Suppression...
                                    </>
                                  ) : (
                                    'Supprimer'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
