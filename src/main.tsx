
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add MathJax type declaration
declare global {
  interface Window {
    MathJax: {
      typesetPromise: (elements: HTMLElement[]) => Promise<any>;
      typeset: (elements?: HTMLElement[]) => void;
      tex: any;
      options: any;
    };
  }
}

createRoot(document.getElementById("root")!).render(<App />);
