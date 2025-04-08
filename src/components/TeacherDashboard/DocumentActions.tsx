
import React from 'react';
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

interface DocumentActionsProps {
  docId: string;
  docName: string;
  isShared: boolean;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
  actionInProgress: string | null;
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  docId,
  docName,
  isShared,
  onDownload,
  onShare,
  onDelete,
  actionInProgress
}) => {
  return (
    <div className="flex items-center justify-end gap-3">
      <Button
        size="sm"
        variant="ghost"
        onClick={onDownload}
        title="Télécharger"
        className="text-muted-foreground hover:text-foreground"
      >
        <Download className="h-4 w-4" />
      </Button>
      
      {!isShared && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onShare}
          disabled={actionInProgress === docId}
          title="Partager"
          className="text-muted-foreground hover:text-foreground"
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
            className="text-muted-foreground hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="premium-card">
          <DialogHeader>
            <DialogTitle className="font-raleway text-xl">Confirmer la suppression</DialogTitle>
            <DialogDescription className="pt-2">
              Êtes-vous sûr de vouloir supprimer le document "{docName}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline" className="font-medium">Annuler</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={onDelete}
              disabled={actionInProgress === docId}
              className="font-medium shadow-subtle"
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
