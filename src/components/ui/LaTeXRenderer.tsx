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
        // Pre-process common chemistry notation patterns that aren't properly wrapped
        let preprocessed = text;
        
        // Handle common superscript/subscript patterns in chemistry
        // Convert patterns like H₂O, CO₂, etc. to proper LaTeX
        preprocessed = preprocessed.replace(/([A-Za-z])([₀-₉]+)/g, '$1$_{$2}$');
        preprocessed = preprocessed.replace(/([A-Za-z])([⁰-⁹]+)/g, '$1$^{$2}$');
        
        // Handle common ionic notation like Ca²⁺, Mg²⁺, etc.
        preprocessed = preprocessed.replace(/([A-Za-z]+)([²³⁴⁵⁶⁷⁸⁹]+)([⁺⁻])/g, '$1$^{$2$3}$');
        
        // Handle scientific notation patterns like cm²mol⁻¹
        preprocessed = preprocessed.replace(/([a-zA-Z]+)([²³⁴⁵⁶⁷⁸⁹]+)([a-zA-Z]+)([⁻¹²³⁴⁵⁶⁷⁸⁹]+)/g, '$1$^{$2}$$3$^{$4}$');
        
        // Handle Lambda symbols and other Greek letters
        preprocessed = preprocessed.replace(/Λ/g, '$\\Lambda$');
        preprocessed = preprocessed.replace(/λ/g, '$\\lambda$');
        preprocessed = preprocessed.replace(/Δ/g, '$\\Delta$');
        preprocessed = preprocessed.replace(/δ/g, '$\\delta$');
        preprocessed = preprocessed.replace(/π/g, '$\\pi$');
        preprocessed = preprocessed.replace(/σ/g, '$\\sigma$');
        preprocessed = preprocessed.replace(/μ/g, '$\\mu$');
        preprocessed = preprocessed.replace(/α/g, '$\\alpha$');
        preprocessed = preprocessed.replace(/β/g, '$\\beta$');
        preprocessed = preprocessed.replace(/γ/g, '$\\gamma$');
        
        // Handle block math first: $$...$$
        // For inline contexts (like option buttons), render as inline even if using $$
        let rendered = preprocessed.replace(/\$\$([^$]+?)\$\$/g, (match, mathContent) => {
          if (!katex) return match;
          try {
            const renderedMath = katex.renderToString(mathContent, { 
              throwOnError: false,
              displayMode: inline ? false : true, // Use inline mode for inline contexts
              output: 'html'
            });
            // Wrap in a span to prevent line breaks
            return `<span class="latex-math-block">${renderedMath}</span>`;
          } catch (e) {
            console.warn('LaTeX rendering error for block math:', mathContent, e);
            return match; // Return original if rendering fails
          }
        });

        // Handle inline math: $...$
        // Use a more robust regex that handles nested braces and complex expressions
        rendered = rendered.replace(/\$([^$]+?)\$/g, (match, mathContent) => {
          if (!katex) return match;
          try {
            const renderedMath = katex.renderToString(mathContent, { 
              throwOnError: false,
              displayMode: false,
              output: 'html'
            });
            // Wrap in a span to prevent line breaks
            return `<span class="latex-math-inline">${renderedMath}</span>`;
          } catch (e) {
            console.warn('LaTeX rendering error for inline math:', mathContent, e);
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
  }, [content, inline]);

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