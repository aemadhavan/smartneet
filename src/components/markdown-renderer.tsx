import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import Image from "next/image"

interface MarkdownRendererProps {
  content: string
}

// Custom callout blockquote renderer
function Callout({ children, type }: { children: React.ReactNode; type: string }) {
  let color = "bg-blue-50 border-blue-400 text-blue-900"
  let title = "Note"
  if (type === "important") {
    color = "bg-yellow-50 border-yellow-400 text-yellow-900"
    title = "Important"
  } else if (type === "warning") {
    color = "bg-red-50 border-red-400 text-red-900"
    title = "Warning"
  }
  return (
    <div className={`border-l-4 p-4 my-4 rounded ${color}`}>
      <div className="font-bold mb-1">{title}</div>
      <div>{children}</div>
    </div>
  )
}

const LiRenderer = (props: React.LiHTMLAttributes<HTMLLIElement> & { checked?: boolean }) => {
  const { children, checked, ...rest } = props;
  if (typeof checked === "boolean") {
    return (
      <li className="flex items-center mb-1" {...rest}>
        <input type="checkbox" checked={checked} readOnly className="mr-2" />
        <span>{children}</span>
      </li>
    );
  }
  return <li className="mb-1" {...rest}>{children}</li>;
};

const CodeRenderer = ({
  inline,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
  const match = /language-(\w+)/.exec(className || "");
  return !inline && match ? (
    <SyntaxHighlighter
      style={vscDarkPlus}
      language={match[1]}
      PreTag="div"
      {...props}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  ) : (
    <code className="bg-gray-100 rounded px-1 py-0.5 text-sm" {...props}>
      {children}
    </code>
  );
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-lg max-w-none dark:prose-invert prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-4xl font-bold mt-8 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-3xl font-semibold mt-6 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-2xl font-semibold mt-4 mb-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-xl font-semibold mt-3 mb-1">{children}</h4>,
          ul: ({ children }) => <ul className="list-disc ml-6 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-6 mb-2">{children}</ol>,
          li: LiRenderer,
          blockquote({ children }) {
            // Callout support: > [!note] ...
            const child = Array.isArray(children) ? children[0] : children
            if (
              typeof child === "string" && child.startsWith("[!") && child.includes("]")
            ) {
              const match = child.match(/^\[!(\w+)](.*)/)
              if (match) {
                const [, type, rest] = match
                return <Callout type={type.toLowerCase()}>{rest.trim()}</Callout>
              }
            }
            return <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 bg-gray-50 py-2 my-4">{children}</blockquote>
          },
          code: CodeRenderer,
          a: ({ href, children }) => <a href={href} className="text-blue-600 underline hover:text-blue-800">{children}</a>,
          img: ({ src = "", alt = "", width, height }) =>
            typeof src === "string" ? (
              <span className="my-4 block max-w-full rounded shadow overflow-hidden">
                <Image
                  src={src}
                  alt={alt}
                  width={width ? +width : 600}
                  height={height ? +height : 400}
                  style={{ width: "100%", height: "auto" }}
                />
              </span>
            ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 