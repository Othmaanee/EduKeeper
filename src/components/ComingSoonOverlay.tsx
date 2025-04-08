
import React from 'react';

interface ComingSoonOverlayProps {
  message: string;
}

export const ComingSoonOverlay = ({ message }: ComingSoonOverlayProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm z-10">
      <div className="text-center px-6 py-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Bientôt disponible</h2>
        <p className="text-lg text-gray-700">{message}</p>
      </div>
    </div>
  );
};
