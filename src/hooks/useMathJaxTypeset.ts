
import { useEffect, useRef } from 'react';

/**
 * A custom hook to typesets MathJax formulas in the provided container element
 * @param content The text content that might contain LaTeX formulas
 * @returns A ref to be assigned to the container element
 */
export const useMathJaxTypeset = (content?: string) => {
  const containerRef = useRef<HTMLElement | null>(null);
  
  // Check if the content contains LaTeX formulas
  const hasLatexFormulas = (text?: string) => {
    if (!text) return false;
    // Check for $$ ... $$ or \( ... \) or \[ ... \]
    return text.includes('$$') || text.includes('\\(') || text.includes('\\[');
  };

  useEffect(() => {
    if (!content || !hasLatexFormulas(content)) return;
    
    // Ensure MathJax is loaded
    if (!window.MathJax) {
      console.warn('MathJax not loaded yet');
      return;
    }

    // Function to typeset the container
    const typesetMath = async () => {
      if (containerRef.current) {
        try {
          // Use MathJax to typeset the container
          await window.MathJax.typesetPromise([containerRef.current]);
        } catch (error) {
          console.error('Error typesetting MathJax:', error);
        }
      }
    };

    // Typeset on content change with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      typesetMath();
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  return containerRef;
};
