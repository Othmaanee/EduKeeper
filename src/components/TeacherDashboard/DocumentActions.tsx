
import React, { useState } from 'react';
import { Download, Share2, Trash2, Loader2 } from 'lucide-react';
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
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

interface DocumentActionsProps {
  docId: string;
  docName: string;
  docUrl: string;
  isShared: boolean;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
  actionInProgress: string | null;
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  docId,
  docName,
  docUrl,
  isShared,
  onDownload,
  onShare,
  onDelete,
  actionInProgress
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Create a container div for the PDF content
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.fontFamily = 'Arial, sans-serif';
      
      // Add document title
      const title = document.createElement('h1');
      title.textContent = docName;
      title.style.borderBottom = '1px solid #ddd';
      title.style.paddingBottom = '10px';
      title.style.marginBottom = '20px';
      container.appendChild(title);
      
      // Fetch the actual content from the document URL
      try {
        const response = await fetch(docUrl);
        const text = await response.text();
        
        // Add document content
        const content = document.createElement('div');
        content.style.lineHeight = '1.5';
        
        if (text && !text.includes('�') && text.length < 500000) {
          // Check if the content is HTML
          if (text.includes('<html') || text.includes('<body')) {
            // Extract body content from HTML
            const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            content.innerHTML = bodyMatch ? bodyMatch[1] : text;
          } else {
            // Format plain text with paragraphs
            const paragraphs = text.split(/\n\s*\n/);
            paragraphs.forEach(paragraph => {
              if (paragraph.trim()) {
                const p = document.createElement('p');
                p.textContent = paragraph.trim();
                content.appendChild(p);
              }
            });
          }
        } else {
          content.textContent = "Le contenu du document n'a pas pu être chargé correctement.";
        }
        
        container.appendChild(content);
      } catch (error) {
        console.error("Erreur lors de la récupération du contenu:", error);
        const errorMsg = document.createElement('p');
        errorMsg.textContent = "Impossible de charger le contenu du document.";
        container.appendChild(errorMsg);
      }
      
      // Add to DOM temporarily (hidden)
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      // Generate PDF
      const opt = {
        margin: 10,
        filename: `${docName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(container).save();
      
      // Clean up
      document.body.removeChild(container);
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF}
        title="Télécharger en PDF"
      >
        {isGeneratingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
      
      {!isShared && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onShare}
          disabled={actionInProgress === docId}
          title="Partager"
        >
          {actionInProgress === docId ? (
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
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le document "{docName}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={onDelete}
              disabled={actionInProgress === docId}
            >
              {actionInProgress === docId ? (
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
  );
};
