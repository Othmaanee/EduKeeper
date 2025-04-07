
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const SummarizeDocumentPage = () => {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch user role
  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Session not found');
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
      return data;
    }
  });

  // Fetch documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['summarize-documents', userRole],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      // Different queries based on user role
      let query = supabase
        .from("documents")
        .select("*, categories(id, nom)");

      if (userRole === 'user') {
        // For students: own documents + shared documents
        query = query.or(`user_id.eq.${session.user.id},is_shared.eq.true`);
      } else if (userRole === 'enseignant') {
        // For teachers: only own documents
        query = query.eq('user_id', session.user.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userRole
  });

  // Generate summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async (documentId: string) => {
      try {
        // Find the selected document
        const selectedDoc = documents.find(doc => doc.id === documentId);
        if (!selectedDoc) {
          throw new Error('Document not found');
        }

        // Call the edge function to generate the summary
        const response = await fetch(`https://mtbcrbfchoqterxevvft.supabase.co/functions/v1/summarize-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            documentUrl: selectedDoc.url,
            documentName: selectedDoc.nom,
            userRole: userRole,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la génération du résumé');
        }

        const data = await response.json();
        return data.summary;
      } catch (error) {
        console.error('Error generating summary:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setSummary(data);
      toast.success('Résumé généré avec succès');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Impossible de générer le résumé, veuillez réessayer.');
      setErrorDialogOpen(true);
      toast.error('Erreur lors de la génération du résumé');
    }
  });

  // Handle document selection
  const handleDocumentChange = (value: string) => {
    setSelectedDocumentId(value);
    setSummary(null); // Reset summary when changing document
  };

  // Handle generate summary button click
  const handleGenerateSummary = () => {
    if (selectedDocumentId) {
      setSummary(null); // Reset previous summary
      generateSummaryMutation.mutate(selectedDocumentId);
    } else {
      toast.error('Veuillez sélectionner un document');
    }
  };

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Résumer un document</h1>

        {/* Different content based on user role */}
        {userRole === 'user' ? (
          <Card className="bg-blue-50 mb-6">
            <CardContent className="pt-6">
              <p className="text-blue-700">
                Besoin d'un résumé plus clair pour mieux comprendre tes cours ? Résume ton document en mots simples avec des exemples et des explications adaptées à ton niveau.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-50 mb-6">
            <CardContent className="pt-6">
              <p className="text-green-700">
                Besoin de simplifier un document pour créer un support à distribuer ? Résumez votre document en quelques secondes en version professionnelle.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {/* Document selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez un document
            </label>
            
            {isLoadingDocuments ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Chargement des documents...
              </div>
            ) : (
              <Select 
                value={selectedDocumentId || ''} 
                onValueChange={handleDocumentChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Documents disponibles</SelectLabel>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {doc.nom} {doc.is_shared && userRole === 'user' && doc.user_id !== userData?.id && '(Partagé)'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Generate button */}
          <div>
            <Button 
              onClick={handleGenerateSummary} 
              disabled={!selectedDocumentId || generateSummaryMutation.isPending}
              className="w-full"
            >
              {generateSummaryMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Résumé en cours...
                </>
              ) : (
                <>
                  Générer un résumé {userRole === 'user' ? 'pédagogique' : 'professionnel'}
                </>
              )}
            </Button>
          </div>

          {/* Summary result */}
          {summary && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  Résumé {userRole === 'user' ? 'pédagogique' : 'professionnel'}
                </CardTitle>
                <CardDescription>
                  {documents.find(doc => doc.id === selectedDocumentId)?.nom}
                </CardDescription>
              </CardHeader>
              <CardContent className="whitespace-pre-line">
                {summary}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateSummary}
                  disabled={generateSummaryMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regénérer
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Error dialog */}
        <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Erreur</AlertDialogTitle>
              <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default SummarizeDocumentPage;
