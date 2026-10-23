import React, { useState } from 'react';
import {
  X,
  Pin,
  Archive,
  ArchiveRestore,
  Edit2,
  Trash2,
  Copy,
  Check,
  Clock,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { CATEGORY_STYLES, PRIORITY_STYLES } from './noteConstants';

export const NoteDetailModal = ({
  isOpen,
  note,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onToggleChecklist,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !note) return null;

  const isPinned = note.is_pinned;
  const isArchived = note.is_archived;
  const categoryStyle = CATEGORY_STYLES[note.category] || CATEGORY_STYLES.General;
  const priorityStyle = PRIORITY_STYLES[note.priority] || PRIORITY_STYLES.Medium;
  const tags = Array.isArray(note.tags) ? note.tags : [];

  const handleCopy = () => {
    const textToCopy = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 flex flex-col max-h-[92vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/70">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category pill */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
                {note.category}
              </span>

              {/* Priority badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
              >
                {note.priority === 'High' && <AlertCircle className="w-3.5 h-3.5" />}
                {note.priority} Priority
              </span>

              {/* Pinned pill */}
              {isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Pinned
                </span>
              )}

              {/* Archived pill */}
              {isArchived && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <Archive className="w-3 h-3" />
                  Archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Copy note */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy note text to clipboard"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {/* Pin / unpin */}
              {!isArchived && (
                <button
                  type="button"
                  onClick={() => onTogglePin(note)}
                  title={isPinned ? 'Unpin note' : 'Pin note to top'}
                  className={`p-2 rounded-lg transition-colors ${
                    isPinned
                      ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-500' : ''}`} />
                </button>
              )}

              {/* Archive / restore */}
              <button
                type="button"
                onClick={() => onToggleArchive(note)}
                title={isArchived ? 'Restore note from archive' : 'Archive note'}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
              >
                {isArchived ? (
                  <ArchiveRestore className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(note);
                }}
                title="Edit note"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => onDelete(note)}
                title="Delete note"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-5 bg-slate-300 mx-1" />

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {note.title}
              </h1>

              {/* Metadata row */}
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                {note.author_name && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Created by: {note.author_name}</span>
                    {note.author_role && (
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-0.5">
                        • {note.author_role}
                      </span>
                    )}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Created: {formatDateTime(note.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Updated: {formatRelativeTime(note.updated_at)}
                </span>
              </div>
            </div>

            {/* Reminder Banner if present */}
            {note.reminder_at && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs font-semibold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Scheduled Reminder: {formatDateTime(note.reminder_at)}</span>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    <Tag className="w-3 h-3 text-slate-400" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Divider */}
            <hr className="border-slate-100" />

            {/* Formatted Note Body */}
            <div className="prose prose-slate max-w-none text-slate-800">
              <MarkdownRenderer
                content={note.content}
                readOnly={false}
                onToggleChecklist={(lineIndex, newChecked) => {
                  if (onToggleChecklist) {
                    onToggleChecklist(note, lineIndex, newChecked);
                  }
                }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              {copied ? 'Note copied to clipboard!' : 'Click any checklist item to toggle its state'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailModal;
