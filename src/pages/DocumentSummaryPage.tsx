
import { Layout } from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { SummaryGenerationForm } from "@/components/DocumentSummary/SummaryGenerationForm";
import { SummaryDisplay } from "@/components/DocumentSummary/SummaryDisplay";
import { useSummaryGeneration } from "@/components/DocumentSummary/useSummaryGeneration";

export function DocumentSummaryPage() {
  const {
    selectedDocumentId,
    setSelectedDocumentId,
    selectedCategoryId,
    setSelectedCategoryId,
    isGeneratingSummary,
    summaryError,
    generatedSummary,
    documentText,
    setDocumentText,
    textInput, 
    setTextInput,
    uploadedFile,
    setUploadedFile,
    inputMethod,
    setInputMethod,
    userData,
    documents,
    userLoading,
    documentsLoading,
    categories,
    handleGenerateSummary,
    saveSummaryMutation,
    saveSummaryAsPdf,
    isSavingPdf
  } = useSummaryGeneration();

  return (
    <Layout>
      <div className="container py-6 relative">
        <h1 className="text-2xl font-bold mb-2">Résumé de Document</h1>
        <p className="text-muted-foreground mb-6">
          Générez automatiquement un résumé à partir d'un texte, d'un fichier ou d'un document existant.
        </p>
        
        <SummaryGenerationForm
          documents={documents}
          userLoading={userLoading}
          documentsLoading={documentsLoading}
          isGeneratingSummary={isGeneratingSummary}
          summaryError={summaryError}
          onGenerateSummary={handleGenerateSummary}
          selectedDocumentId={selectedDocumentId}
          setSelectedDocumentId={setSelectedDocumentId}
          textInput={textInput}
          setTextInput={setTextInput}
          inputMethod={inputMethod}
          setInputMethod={setInputMethod}
          documentText={documentText}
          setDocumentText={setDocumentText}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          userData={userData}
        />
        
        {/* Loading indicator when generating summary */}
        {isGeneratingSummary && (
          <div className="mb-6 animate-fade-in">
            <div className="text-center mb-2 text-sm text-muted-foreground">
              Analyse et création du résumé en cours...
            </div>
            <Progress value={undefined} className="h-1" />
          </div>
        )}
        
        {/* Display the generated summary */}
        {generatedSummary && (
          <SummaryDisplay
            generatedSummary={generatedSummary}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            saveSummaryMutation={saveSummaryMutation}
            saveSummaryAsPdf={saveSummaryAsPdf}
            isSavingPdf={isSavingPdf}
          />
        )}
      </div>
    </Layout>
  );
}

export default DocumentSummaryPage;
