// src/components/ui/LaTeXRenderer.tsx
'use client';

import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import type KaTeX from 'katex';

interface LaTeXRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

// Dynamically import KaTeX to avoid SSR issues
let katex: typeof KaTeX | null = null;

if (typeof window !== 'undefined') {
  import('katex').then((KaTeX) => {
    katex = KaTeX.default;
  });
}

export function LaTeXRenderer({ content, className = '', inline = false }: LaTeXRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !katex) return;

    try {
      // Function to render LaTeX with mixed content
      const renderMixedContent = (text: string): string => {
        // Handle inline math: $...$
        let rendered = text.replace(/\$([^$]+)\$/g, (match, mathContent) => {
          if (!katex) return match;
          try {
            return katex.renderToString(mathContent, { 
              throwOnError: false,
              displayMode: false,
              output: 'html'
            });
          } catch (e) {
            console.warn('LaTeX rendering error for inline math:', mathContent, e);
            return match; // Return original if rendering fails
          }
        });

        // Handle block math: $$...$$
        rendered = rendered.replace(/\$\$([^$]+)\$\$/g, (match, mathContent) => {
          if (!katex) return match;
          try {
            return katex.renderToString(mathContent, { 
              throwOnError: false,
              displayMode: true,
              output: 'html'
            });
          } catch (e) {
            console.warn('LaTeX rendering error for block math:', mathContent, e);
            return match; // Return original if rendering fails
          }
        });

        return rendered;
      };

      const renderedContent = renderMixedContent(content);
      containerRef.current.innerHTML = renderedContent;
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      // Fallback to original content if rendering fails
      if (containerRef.current) {
        containerRef.current.innerHTML = content;
      }
    }
  }, [content]);

  // Loading state while KaTeX is being imported
  if (typeof window !== 'undefined' && !katex) {
    return (
      <div 
        className={`${className} animate-pulse`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`latex-content ${className}`}
      style={{
        lineHeight: inline ? 'inherit' : '1.6',
      }}
    />
  );
}

// Hook for chemistry-specific LaTeX rendering
export function useChemistryLaTeX() {
  const renderChemistry = (content: string): string => {
    if (!content) return '';
    
    // Common chemistry patterns that might need special handling
    const processed = content;
    
    // Handle chemical formulas with subscripts (already in LaTeX format)
    // These should already be in the format: H$_2$O, CO$_2$, etc.
    
    // Handle ion charges (already in LaTeX format)
    // These should already be in the format: Ca$^{2+}$, Cl$^{-}$, etc.
    
    // Handle reaction arrows (already in LaTeX format)
    // These should already be in the format: $\rightarrow$, $\rightleftharpoons$, etc.
    
    return processed;
  };

  return { renderChemistry };
}