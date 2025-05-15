
import React from 'react';

interface ComingSoonOverlayProps {
  message: string;
  show?: boolean; // Nouvelle prop pour rendre l'affichage optionnel
  title?: string; // Prop pour personnaliser le titre
  description?: string; // Prop pour description additionnelle
}

export const ComingSoonOverlay = ({ 
  message, 
  show = true, 
  title = "Bientôt disponible", 
  description 
}: ComingSoonOverlayProps) => {
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm z-10">
      <div className="text-center px-6 py-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-lg text-gray-700">{message}</p>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
      </div>
    </div>
  );
};
