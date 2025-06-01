import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  ExternalLink,
  FileText,
  Code,
  Image,
  List,
  Hash,
  Quote,
  Table,
  AlertCircle,
  Info,
  CheckCircle,
  Lightbulb,
  Star,
  Zap
} from 'lucide-react';

const MarkdownRenderer = ({ markdownContent, title = "Document", fileName = "" }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedCode, setCopiedCode] = useState('');
  const [tableOfContents, setTableOfContents] = useState([]);

  // Parse markdown content and extract table of contents
  useEffect(() => {
    const lines = markdownContent.split('\n');
    const toc = [];
    
    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        toc.push({ level, text, id, line: index });
      }
    });
    
    setTableOfContents(toc);
  }, [markdownContent]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const copyToClipboard = async (text, codeId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Component for rendering different markdown elements
  const MarkdownElement = ({ type, content, props = {} }) => {
    switch (type) {
      case 'header':
        const HeaderTag = `h${props.level}`;
        const headerClasses = {
          1: 'text-4xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-200',
          2: 'text-3xl font-bold text-gray-800 mb-5 mt-8 pb-2 border-b border-gray-200',
          3: 'text-2xl font-semibold text-gray-800 mb-4 mt-6',
          4: 'text-xl font-semibold text-gray-700 mb-3 mt-5',
          5: 'text-lg font-semibold text-gray-700 mb-2 mt-4',
          6: 'text-base font-semibold text-gray-600 mb-2 mt-3'
        };
        
        return React.createElement(
          HeaderTag,
          { 
            id: props.id,
            className: headerClasses[props.level] || headerClasses[3]
          },
          content
        );

      case 'paragraph':
        return <p className="text-gray-700 leading-relaxed mb-4">{content}</p>;

      case 'code-block':
        return (
          <div className="relative bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">{props.language}</span>
              <button
                onClick={() => copyToClipboard(content, props.id)}
                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                {copiedCode === props.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="text-xs">
                  {copiedCode === props.id ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>
            <pre className="text-gray-300 text-sm overflow-x-auto">
              <code>{content}</code>
            </pre>
          </div>
        );

      case 'inline-code':
        return (
          <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
            {content}
          </code>
        );

      case 'list':
        const ListTag = props.ordered ? 'ol' : 'ul';
        const listClass = props.ordered 
          ? 'list-decimal list-inside space-y-2 mb-4 pl-4' 
          : 'list-disc list-inside space-y-2 mb-4 pl-4';
        
        return (
          <ListTag className={listClass}>
            {content.map((item, index) => (
              <li key={index} className="text-gray-700 leading-relaxed">
                {item}
              </li>
            ))}
          </ListTag>
        );

      case 'blockquote':
        return (
          <blockquote className="border-l-4 border-blue-400 bg-blue-50 p-4 mb-4 rounded-r-lg">
            <div className="flex items-start gap-2">
              <Quote className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
              <div className="text-blue-800">{content}</div>
            </div>
          </blockquote>
        );

      case 'table':
        return (
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  {props.headers.map((header, index) => (
                    <th key={index} className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-200">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-gray-700 border-b border-gray-100">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'link':
        return (
          <a 
            href={props.href} 
            className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            target={props.external ? '_blank' : '_self'}
            rel={props.external ? 'noopener noreferrer' : ''}
          >
            {content}
            {props.external && <ExternalLink className="h-3 w-3" />}
          </a>
        );

      case 'image':
        return (
          <div className="mb-6">
            <img 
              src={props.src} 
              alt={props.alt} 
              className="max-w-full h-auto rounded-lg shadow-md"
            />
            {props.alt && (
              <p className="text-center text-gray-600 text-sm mt-2 italic">{props.alt}</p>
            )}
          </div>
        );

      case 'hr':
        return <hr className="border-gray-300 my-8" />;

      case 'alert':
        const alertStyles = {
          info: 'bg-blue-50 border-blue-200 text-blue-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          error: 'bg-red-50 border-red-200 text-red-800',
          success: 'bg-green-50 border-green-200 text-green-800'
        };
        
        const alertIcons = {
          info: Info,
          warning: AlertCircle,
          error: AlertCircle,
          success: CheckCircle
        };
        
        const AlertIcon = alertIcons[props.type] || Info;
        
        return (
          <div className={`border-l-4 p-4 mb-4 rounded-r-lg ${alertStyles[props.type] || alertStyles.info}`}>
            <div className="flex items-start gap-2">
              <AlertIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>{content}</div>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-700 mb-4">{content}</div>;
    }
  };

  // Simple markdown parser (basic implementation)
  const parseMarkdown = (markdown) => {
    const lines = markdown.split('\n');
    const elements = [];
    let currentList = null;
    let currentTable = null;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLanguage = '';
    let blockId = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push({
            type: 'code-block',
            content: codeBlockContent.trim(),
            props: { language: codeBlockLanguage, id: `code-${blockId++}` }
          });
          inCodeBlock = false;
          codeBlockContent = '';
          codeBlockLanguage = '';
        } else {
          inCodeBlock = true;
          codeBlockLanguage = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        elements.push({
          type: 'header',
          content: text,
          props: { level, id }
        });
        continue;
      }

      // Horizontal rule
      if (line.match(/^[-*_]{3,}$/)) {
        elements.push({ type: 'hr', content: '' });
        continue;
      }

      // Lists
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)/);
      if (listMatch) {
        const isOrdered = /^\d+\./.test(listMatch[2]);
        const content = listMatch[3];
        
        if (!currentList || currentList.ordered !== isOrdered) {
          if (currentList) {
            elements.push(currentList);
          }
          currentList = {
            type: 'list',
            content: [content],
            props: { ordered: isOrdered }
          };
        } else {
          currentList.content.push(content);
        }
        continue;
      } else if (currentList) {
        elements.push(currentList);
        currentList = null;
      }

      // Blockquotes
      if (line.startsWith('>')) {
        elements.push({
          type: 'blockquote',
          content: line.slice(1).trim()
        });
        continue;
      }

      // Tables (basic detection)
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!currentTable) {
          currentTable = {
            type: 'table',
            content: [],
            props: { headers: [] }
          };
        }
        const cells = line.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
        if (currentTable.content.length === 0) {
          currentTable.props.headers = cells;
        } else {
          currentTable.content.push(cells);
        }
        continue;
      } else if (currentTable) {
        elements.push(currentTable);
        currentTable = null;
      }

      // Regular paragraphs
      if (line.trim()) {
        // Process inline elements
        let processedLine = line;
        
        // Inline code
        processedLine = processedLine.replace(/`([^`]+)`/g, (match, code) => {
          return `<code>${code}</code>`;
        });
        
        // Bold and italic
        processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        processedLine = processedLine.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Links
        processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
          const isExternal = url.startsWith('http');
          return `<a href="${url}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}>${text}${isExternal ? ' ↗' : ''}</a>`;
        });

        elements.push({
          type: 'paragraph',
          content: <span dangerouslySetInnerHTML={{ __html: processedLine }} />
        });
      }
    }

    // Add remaining list or table
    if (currentList) elements.push(currentList);
    if (currentTable) elements.push(currentTable);

    return elements;
  };

  const parsedElements = parseMarkdown(markdownContent);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-8 w-8" />
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        {fileName && (
          <div className="flex items-center gap-2 text-indigo-100">
            <Code className="h-4 w-4" />
            <span className="text-sm font-mono">{fileName}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Table of Contents */}
        {tableOfContents.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <List className="h-5 w-5" />
                Table of Contents
              </h2>
              <nav className="space-y-2">
                {tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSection(item.id)}
                    className={`block w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 transition-colors ${
                      item.level === 1 ? 'font-semibold text-gray-800' :
                      item.level === 2 ? 'font-medium text-gray-700 ml-3' :
                      'text-gray-600 ml-6'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`${tableOfContents.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <article className="prose prose-lg max-w-none">
              {parsedElements.map((element, index) => (
                <MarkdownElement
                  key={index}
                  type={element.type}
                  content={element.content}
                  props={element.props}
                />
              ))}
            </article>
          </div>

          {/* Document Stats */}
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Sections</p>
                  <p className="text-lg font-semibold text-blue-700">{tableOfContents.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Words</p>
                  <p className="text-lg font-semibold text-green-700">
                    {markdownContent.split(/\s+/).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Code Blocks</p>
                  <p className="text-lg font-semibold text-purple-700">
                    {parsedElements.filter(el => el.type === 'code-block').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Images</p>
                  <p className="text-lg font-semibold text-orange-700">
                    {parsedElements.filter(el => el.type === 'image').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};