
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyDocumentStateProps {
  title: string;
  description: string;
  showUploadButton?: boolean;
}

export const EmptyDocumentState: React.FC<EmptyDocumentStateProps> = ({
  title,
  description,
  showUploadButton = true
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center p-8 bg-muted/30 rounded-lg border border-dashed">
      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        <Button onClick={() => navigate('/generate')}>
          Générer un cours
        </Button>
        <Button variant="outline" onClick={() => navigate('/exercises')}>
          Générer des exercices
        </Button>
        {showUploadButton && (
          <Button variant="outline" onClick={() => navigate('/upload')}>
            Importer un document
          </Button>
        )}
      </div>
    </div>
  );
};
