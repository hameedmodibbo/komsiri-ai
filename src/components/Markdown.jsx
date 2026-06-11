import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Super-light keyword highlighter for code blocks
 */
function highlightCode(code, lang = '') {
  if (!code) return '';
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const cleanLang = lang.toLowerCase();
  
  if (cleanLang === 'js' || cleanLang === 'jsx' || cleanLang === 'javascript' || cleanLang === 'ts' || cleanLang === 'tsx' || cleanLang === 'json') {
    return escaped
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|default|class|extends|new|async|await|try|catch|true|false|null)\b/g, '<span class="text-pink-400 font-semibold">$1</span>')
      // Strings
      .replace(/(["'`])(.*?)\1/g, '<span class="text-green-400">$&</span>')
      // Comments
      .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>')
      // Functions
      .replace(/\b(\w+)(?=\()/g, '<span class="text-blue-400">$1</span>');
  }

  if (cleanLang === 'python' || cleanLang === 'py') {
    return escaped
      // Keywords
      .replace(/\b(def|class|return|if|elif|else|for|while|in|import|from|as|try|except|True|False|None|print|and|or|not|is|lambda)\b/g, '<span class="text-pink-400 font-semibold">$1</span>')
      // Strings
      .replace(/(["'`])(.*?)\1/g, '<span class="text-green-400">$&</span>')
      // Comments
      .replace(/(#.*)/g, '<span class="text-slate-500 italic">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');
  }

  if (cleanLang === 'html' || cleanLang === 'xml' || cleanLang === 'svg') {
    return escaped
      // Tags
      .replace(/(&lt;\/?[a-zA-Z0-9:-]+)/g, '<span class="text-red-400 font-medium">$1</span>')
      // Attributes
      .replace(/(\s[a-zA-Z:-]+)(?=\s*=)/g, '<span class="text-rose-300">$1</span>')
      // Tag closing braces
      .replace(/(\/?&gt;)/g, '<span class="text-red-400 font-medium">$1</span>')
      // Strings/Attr values
      .replace(/(=".*?")/g, '<span class="text-green-400">$1</span>')
      // Comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-slate-500 italic">$1</span>');
  }

  if (cleanLang === 'css') {
    return escaped
      // Selectors
      .replace(/([^{]+)(?=\s*\{)/g, '<span class="text-blue-400 font-medium">$1</span>')
      // Properties
      .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="text-rose-300">$1</span>')
      // Values
      .replace(/(:\s*[^;\s]+)/g, '<span class="text-amber-400">$1</span>')
      // Comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>');
  }

  // Fallback for simple keyword colorings
  return escaped
    .replace(/\b(const|let|var|def|function|return|if|else|import|export|class|true|false)\b/g, '<span class="text-pink-400 font-semibold">$1</span>')
    .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$&</span>');
}

/**
 * Handles copying and styled wrapper for code blocks
 */
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = highlightCode(code, language);

  return (
    <div className="relative group my-4 rounded-xl border border-slate-700/50 overflow-hidden bg-slate-950 font-mono text-sm shadow-lg max-w-full">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800/80 text-xs text-slate-400 select-none">
        <span className="font-semibold uppercase tracking-wider text-slate-300">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all select-none cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400 shrink-0" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 shrink-0" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto scrolling-touch leading-relaxed">
        <pre><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
      </div>
    </div>
  );
}

/**
 * Standard inline text parses (Bold, Italic, Inline Code, Links)
 */
function parseInlineText(text) {
  if (!text) return '';
  
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>');
  
  // Italic *text*
  escaped = escaped.replace(/\*(.*?)\*/g, '<em class="italic text-slate-200">$1</em>');

  // Inline code `code`
  escaped = escaped.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-950/80 border border-slate-800/60 font-mono text-pink-400 text-xs">$1</code>');

  // Links [text](url)
  escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline font-medium">$1</a>');

  return escaped;
}

/**
 * Complete markdown-to-React node converter
 */
export default function Markdown({ content }) {
  if (!content) return null;

  // Split content by code blocks ` ```lang ... ``` `
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text preceding the code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }

    // Add the code block
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      code: match[2].trim()
    });

    lastIndex = codeBlockRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }

  return (
    <div className="space-y-3.5 leading-relaxed text-[15px] max-w-full text-slate-200">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock 
              key={`code-${index}`} 
              code={part.code} 
              language={part.language} 
            />
          );
        }

        // Parse paragraphs, headers, lists
        const lines = part.content.split('\n');
        const renderedElements = [];
        let listBuffer = [];
        let listType = null; // 'bullet' or 'number'

        const flushList = (keyPrefix) => {
          if (listBuffer.length > 0) {
            if (listType === 'bullet') {
              renderedElements.push(
                <ul key={`ul-${keyPrefix}`} className="list-disc pl-6 space-y-1 my-2 text-slate-300">
                  {listBuffer.map((item, id) => (
                    <li key={`li-${id}`} dangerouslySetInnerHTML={{ __html: parseInlineText(item) }} />
                  ))}
                </ul>
              );
            } else if (listType === 'number') {
              renderedElements.push(
                <ol key={`ol-${keyPrefix}`} className="list-decimal pl-6 space-y-1 my-2 text-slate-300">
                  {listBuffer.map((item, id) => (
                    <li key={`li-${id}`} dangerouslySetInnerHTML={{ __html: parseInlineText(item) }} />
                  ))}
                </ol>
              );
            }
            listBuffer = [];
            listType = null;
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();

          // 1. Headers: #, ##, ###
          if (trimmedLine.startsWith('# ')) {
            flushList(`h1-${i}`);
            renderedElements.push(
              <h1 key={`h1-${i}`} className="text-2xl font-bold text-slate-50 mt-4 mb-2 tracking-tight" dangerouslySetInnerHTML={{ __html: parseInlineText(trimmedLine.substring(2)) }} />
            );
          } else if (trimmedLine.startsWith('## ')) {
            flushList(`h2-${i}`);
            renderedElements.push(
              <h2 key={`h2-${i}`} className="text-xl font-semibold text-slate-50 mt-4 mb-2 tracking-tight" dangerouslySetInnerHTML={{ __html: parseInlineText(trimmedLine.substring(3)) }} />
            );
          } else if (trimmedLine.startsWith('### ')) {
            flushList(`h3-${i}`);
            renderedElements.push(
              <h3 key={`h3-${i}`} className="text-lg font-semibold text-slate-100 mt-3 mb-1 tracking-tight" dangerouslySetInnerHTML={{ __html: parseInlineText(trimmedLine.substring(4)) }} />
            );
          }
          // 2. Bullet Lists: - or *
          else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            if (listType !== 'bullet') {
              flushList(`list-${i}`);
              listType = 'bullet';
            }
            listBuffer.push(trimmedLine.substring(2));
          }
          // 3. Number Lists: 1. 2.
          else if (/^\d+\.\s/.test(trimmedLine)) {
            if (listType !== 'number') {
              flushList(`list-${i}`);
              listType = 'number';
            }
            // Strip the digits and period
            const cleanText = trimmedLine.replace(/^\d+\.\s/, '');
            listBuffer.push(cleanText);
          }
          // 4. Empty Line (Paragraph Separator)
          else if (!trimmedLine) {
            flushList(`empty-${i}`);
          }
          // 5. Standard line text
          else {
            flushList(`text-pre-${i}`);
            renderedElements.push(
              <p key={`p-${i}`} className="my-1.5 focus:outline-none" dangerouslySetInnerHTML={{ __html: parseInlineText(trimmedLine) }} />
            );
          }
        }

        // Flush any trailing lists
        flushList(`final-${index}`);

        return <div key={`text-block-${index}`}>{renderedElements}</div>;
      })}
    </div>
  );
}
