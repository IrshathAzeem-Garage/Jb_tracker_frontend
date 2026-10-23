import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

/**
 * Lightweight, safe, and zero-dependency Markdown & Checklist renderer
 * Styled precisely for Freakz Tracker's executive Tailwind palette.
 */
export const MarkdownRenderer = ({ content = '', onToggleChecklist, readOnly = true }) => {
  if (!content || !content.trim()) {
    return <p className="text-slate-400 italic text-sm">No content provided.</p>;
  }

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  const parseInline = (text) => {
    if (!text) return null;

    // Pattern matches:
    // **bold**
    // *italic*
    // `code`
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/);
      // Inline code
      const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/);
      // Italic
      const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)$/);

      // Find earliest match
      let earliest = null;
      let matchType = null;

      if (boldMatch) {
        earliest = boldMatch;
        matchType = 'bold';
      }

      if (codeMatch && (!earliest || codeMatch[1].length < earliest[1].length)) {
        earliest = codeMatch;
        matchType = 'code';
      }

      if (italicMatch && (!earliest || italicMatch[1].length < earliest[1].length)) {
        earliest = italicMatch;
        matchType = 'italic';
      }

      if (earliest) {
        if (earliest[1]) {
          parts.push(<span key={`text-${keyIdx++}`}>{earliest[1]}</span>);
        }

        if (matchType === 'bold') {
          parts.push(<strong key={`bold-${keyIdx++}`} className="font-bold text-slate-900">{earliest[2]}</strong>);
        } else if (matchType === 'code') {
          parts.push(
            <code key={`code-${keyIdx++}`} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-mono border border-slate-200">
              {earliest[2]}
            </code>
          );
        } else if (matchType === 'italic') {
          parts.push(<em key={`italic-${keyIdx++}`} className="italic text-slate-700">{earliest[2]}</em>);
        }

        remaining = earliest[3];
      } else {
        parts.push(<span key={`text-${keyIdx++}`}>{remaining}</span>);
        break;
      }
    }

    return parts;
  };

  lines.forEach((line, index) => {
    // Code block fence
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-block-${index}`} className="p-3 my-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`empty-${index}`} className="h-2" />);
      return;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
          {parseInline(trimmed.substring(2))}
        </h1>
      );
      return;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg font-bold text-slate-900 mt-3 mb-1.5">
          {parseInline(trimmed.substring(3))}
        </h2>
      );
      return;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-sm font-bold text-slate-800 mt-2 mb-1 uppercase tracking-wider">
          {parseInline(trimmed.substring(4))}
        </h3>
      );
      return;
    }

    // Checklist item [ ] or [x]
    const checklistMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.*)$/);
    if (checklistMatch) {
      const isChecked = checklistMatch[1].toLowerCase() === 'x';
      const itemText = checklistMatch[2];
      elements.push(
        <div
          key={`check-${index}`}
          className={`flex items-start gap-2.5 my-1 text-sm ${
            !readOnly && onToggleChecklist ? 'cursor-pointer select-none group' : ''
          }`}
          onClick={() => {
            if (!readOnly && onToggleChecklist) {
              onToggleChecklist(index, !isChecked);
            }
          }}
        >
          {isChecked ? (
            <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600 mt-0.5 shrink-0" />
          )}
          <span className={isChecked ? 'line-through text-slate-400' : 'text-slate-700'}>
            {parseInline(itemText)}
          </span>
        </div>
      );
      return;
    }

    // Bullet List
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 my-1 text-sm text-slate-700 pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
          <span>{parseInline(trimmed.substring(2))}</span>
        </div>
      );
      return;
    }

    // Numbered List
    const numMatch = trimmed.match(/^(\d+)\.\s*(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${index}`} className="flex items-start gap-2 my-1 text-sm text-slate-700 pl-2">
          <span className="font-semibold text-xs text-slate-500 min-w-[16px] text-right mt-0.5">
            {numMatch[1]}.
          </span>
          <span>{parseInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${index}`} className="pl-3.5 py-1 my-2 border-l-3 border-slate-300 text-slate-600 italic text-sm bg-slate-50/50 rounded-r">
          {parseInline(trimmed.substring(2))}
        </blockquote>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${index}`} className="text-sm text-slate-700 leading-relaxed my-1">
        {parseInline(line)}
      </p>
    );
  });

  return <div className="space-y-0.5 break-words">{elements}</div>;
};

export default MarkdownRenderer;
