"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  children: string;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className }) => {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <span className="text-sm font-medium text-muted-foreground">
          {language || "text"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={resolvedTheme === "dark" ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 0.375rem 0.375rem",
          fontSize: "0.875rem",
        }}
        showLineNumbers={true}
        wrapLines={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

interface BlogContentProps {
  content: string;
}

export const BlogContent: React.FC<BlogContentProps> = ({ content }) => {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");
            return !isInline && match ? (
              <CodeBlock className={className}>
                {String(children).replace(/\n$/, "")}
              </CodeBlock>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom blockquote styling
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                {children}
              </blockquote>
            );
          },
          // Custom table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full divide-y divide-border">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {children}
              </td>
            );
          },
          // Custom link styling
          a({ children, href }) {
            return (
              <a
                href={href}
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          // Custom heading styling with anchors
          h1({ children, id }) {
            return (
              <h1 id={id} className="text-3xl font-bold mt-8 mb-4 scroll-mt-20">
                {children}
                {id && (
                  <a
                    href={`#${id}`}
                    className="ml-2 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Link to this section"
                  >
                    §
                  </a>
                )}
              </h1>
            );
          },
          h2({ children, id }) {
            return (
              <h2 id={id} className="text-2xl font-bold mt-8 mb-4 scroll-mt-20">
                {children}
                {id && (
                  <a
                    href={`#${id}`}
                    className="ml-2 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Link to this section"
                  >
                    §
                  </a>
                )}
              </h2>
            );
          },
          h3({ children, id }) {
            return (
              <h3
                id={id}
                className="text-xl font-semibold mt-6 mb-3 scroll-mt-20"
              >
                {children}
                {id && (
                  <a
                    href={`#${id}`}
                    className="ml-2 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Link to this section"
                  >
                    §
                  </a>
                )}
              </h3>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
