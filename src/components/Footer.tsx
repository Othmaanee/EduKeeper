
import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="mt-auto py-6 px-6 bg-background border-t">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
            alt="EduKeeper Logo" 
            className="h-6 w-6" 
          />
          <span className="font-semibold text-foreground">EduKeeper</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link to="/documents" className="text-muted-foreground hover:text-foreground">
            Documents
          </Link>
          <Link to="/categories" className="text-muted-foreground hover:text-foreground">
            Catégories
          </Link>
          <span className="text-muted-foreground">|</span>
          <span className="text-muted-foreground">
            © 2024 EduKeeper. Tous droits réservés.
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Créé par Othmane Tadjouri
        </div>
      </div>
    </footer>
  );
};
