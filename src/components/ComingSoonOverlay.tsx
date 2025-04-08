
import React from 'react';

interface ComingSoonOverlayProps {
  message: string;
}

export const ComingSoonOverlay = ({ message }: ComingSoonOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="max-w-md p-6 text-center">
        <h2 className="text-2xl font-bold text-primary mb-3">Bientôt disponible</h2>
        <p className="text-lg text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default ComingSoonOverlay;
