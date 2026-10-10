import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * MarkdownRenderer
 * ================
 * Renders LLM and user markdown content with MantraAI design tokens:
 * - Proper heading hierarchy (h1, h2, h3, h4)
 * - Styled unordered and ordered lists with custom bullet/number styling
 * - Bold (<strong>), italic (<em>), and bold-italic
 * - Blockquotes with forest green accent border
 * - Inline code and preformatted code blocks
 * - Clickable links opening safely in new tabs
 * - Tables and horizontal dividers
 * - Responsive typography and line heights
 */
export default function MarkdownRenderer({ content, isUser = false, className = '' }) {
  if (!content) return null;

  return (
    <div
      className={`prose prose-stone max-w-none text-sm md:text-[15px] leading-relaxed ${
        isUser ? 'text-white' : 'text-[#1C1917]'
      } ${className}`}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p
              className={`mb-3.5 last:mb-0 leading-relaxed font-normal ${
                isUser ? 'text-white' : 'text-[#1C1917]'
              }`}
            >
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong
              className={`font-semibold ${
                isUser ? 'text-white font-bold' : 'text-[#1C1917]'
              }`}
            >
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className={`italic ${isUser ? 'text-white/90' : 'text-[#44403C]'}`}>
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul
              className={`my-3 space-y-1.5 list-disc list-outside ml-5 ${
                isUser ? 'text-white marker:text-white/80' : 'text-[#1C1917] marker:text-[#1E3A2B]'
              }`}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={`my-3 space-y-1.5 list-decimal list-outside ml-5 ${
                isUser ? 'text-white marker:text-white/80' : 'text-[#1C1917] marker:text-[#1E3A2B]'
              }`}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 marker:font-semibold">
              {children}
            </li>
          ),
          h1: ({ children }) => (
            <h1
              className={`text-base md:text-lg font-bold mt-4 mb-2 first:mt-0 ${
                isUser ? 'text-white' : 'text-[#1C1917]'
              }`}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={`text-sm md:text-base font-bold mt-3.5 mb-2 first:mt-0 ${
                isUser ? 'text-white' : 'text-[#1C1917]'
              }`}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={`text-xs md:text-sm font-bold mt-3 mb-1.5 first:mt-0 ${
                isUser ? 'text-white' : 'text-[#1C1917]'
              }`}
            >
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={`my-3 pl-3.5 border-l-[3.5px] italic rounded-r-lg py-1 ${
                isUser
                  ? 'border-white/50 text-white/90 bg-white/10'
                  : 'border-[#1E3A2B] text-[#57534E] bg-[#F4F1EA]'
              }`}
            >
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code
                  className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                    isUser ? 'bg-white/20 text-white' : 'bg-[#EFECE6] text-[#1E3A2B] font-semibold'
                  }`}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                className={`p-3 rounded-xl overflow-x-auto my-3 text-xs font-mono ${
                  isUser ? 'bg-black/30 text-white' : 'bg-[#1E293B] text-[#F8FAFC]'
                }`}
              >
                <code>{children}</code>
              </pre>
            );
          },
          hr: () => (
            <hr className={`my-4 ${isUser ? 'border-white/20' : 'border-[#E8E5DF]'}`} />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline underline-offset-2 font-medium transition-colors ${
                isUser ? 'text-white hover:text-white/80' : 'text-[#1E3A2B] hover:text-[#162C20]'
              }`}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-xs border border-[#E8E5DF] rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#FAF9F6] border-b border-[#E8E5DF] text-[#1C1917] font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#E8E5DF]">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#FAF9F6]/50 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-left">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
