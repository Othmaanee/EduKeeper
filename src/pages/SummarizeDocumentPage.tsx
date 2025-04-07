
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  nom: string;
  url: string;
  user_id: string;
  is_shared: boolean;
}

interface User {
  id: string;
  role: string;
}

const SummarizeDocumentPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState<boolean>(true);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        const { data, error } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user:', error);
          return;
        }
        
        setUser(data as User);
      }
    };
    
    fetchUser();
  }, []);

  // Fetch documents based on user role
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;
      
      setLoadingDocuments(true);
      
      let query = supabase.from('documents').select('*');
      
      if (user.role === 'enseignant') {
        // Teachers can only see their own documents
        query = query.eq('user_id', user.id);
      } else {
        // Students can see their own documents or shared documents
        query = query.or(`user_id.eq.${user.id},is_shared.eq.true`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les documents.",
          variant: "destructive",
        });
      } else {
        setDocuments(data as Document[]);
      }
      
      setLoadingDocuments(false);
    };
    
    fetchDocuments();
  }, [user]);

  // Set selected document when document id changes
  useEffect(() => {
    if (selectedDocId && documents.length > 0) {
      const doc = documents.find(d => d.id === selectedDocId);
      setSelectedDocument(doc || null);
    } else {
      setSelectedDocument(null);
    }
  }, [selectedDocId, documents]);

  const handleSelectDocument = (value: string) => {
    setSelectedDocId(value);
    setSummary('');
  };

  const generateSummary = async () => {
    if (!selectedDocument) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner un document à résumer.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSummary('');

    try {
      const response = await fetch('/api/summarize-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl: selectedDocument.url,
          userRole: user?.role
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du résumé');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le résumé, veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    generateSummary();
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Résumer un document</h1>
        
        {user && (
          <p className="text-lg mb-6">
            {user.role === 'enseignant' 
              ? "Besoin de simplifier un document pour créer un support à distribuer ? Résumez votre document en quelques secondes en version professionnelle."
              : "Besoin d'un résumé plus clair pour mieux comprendre tes cours ? Résume ton document en mots simples avec des exemples et des explications adaptées à ton niveau."
            }
          </p>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sélectionner un document</CardTitle>
            <CardDescription>
              Choisissez le document que vous souhaitez résumer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full md:w-2/3">
                <Select 
                  value={selectedDocId} 
                  onValueChange={handleSelectDocument}
                  disabled={loadingDocuments}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={generateSummary}
                disabled={loading || !selectedDocId}
                className="w-full md:w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user?.role === 'enseignant' ? 'Générer un résumé professionnel' : 'Générer un résumé pédagogique'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résumé de {selectedDocument?.nom}</span>
                <Button
                  variant="outline" 
                  size="sm" 
                  onClick={handleRegenerate}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regénérer
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
                {summary.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SummarizeDocumentPage;
