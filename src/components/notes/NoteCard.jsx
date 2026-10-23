import React from 'react';
import {
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters';
import { CATEGORY_STYLES, PRIORITY_STYLES } from './noteConstants';

export const NoteCard = ({
  note,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onSelectTag,
}) => {
  const isPinned = note.is_pinned;
  const isArchived = note.is_archived;
  const categoryStyle = CATEGORY_STYLES[note.category] || CATEGORY_STYLES.General;
  const priorityStyle = PRIORITY_STYLES[note.priority] || PRIORITY_STYLES.Medium;

  // Clean tags
  const tags = Array.isArray(note.tags) ? note.tags : [];

  // Reminder status
  let isReminderOverdue = false;
  let formattedReminder = null;
  if (note.reminder_at) {
    const reminderDate = new Date(note.reminder_at);
    if (!isNaN(reminderDate.getTime())) {
      isReminderOverdue = reminderDate < new Date();
      formattedReminder = formatDateTime(note.reminder_at);
    }
  }

  // Strip markdown formatting for snippet preview
  const getPlainTextPreview = (md) => {
    if (!md) return '';
    return md
      .replace(/#+\s/g, '')
      .replace(/-\s\[[ xX]\]\s/g, '• ')
      .replace(/-\s/g, '• ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/>\s/g, '')
      .trim();
  };

  const previewSnippet = getPlainTextPreview(note.content);

  return (
    <div
      onClick={() => onView(note)}
      className={`group relative flex flex-col justify-between rounded-xl bg-white border transition-all duration-200 cursor-pointer overflow-hidden ${
        isPinned
          ? 'border-amber-300/80 shadow-[0_2px_12px_rgba(245,158,11,0.08)] bg-gradient-to-b from-amber-50/20 to-white hover:border-amber-400 hover:shadow-[0_4px_16px_rgba(245,158,11,0.12)]'
          : 'border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Top accent bar for pinned notes */}
      {isPinned && (
        <div className="h-1 w-full bg-amber-400" />
      )}

      {/* Main card body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Header badges and Pin toggle */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
              {note.category}
            </span>

            {/* Priority indicator */}
            {note.priority === 'High' && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
              >
                <AlertCircle className="w-3 h-3" />
                High
              </span>
            )}
            {note.priority === 'Medium' && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
              >
                Med
              </span>
            )}
          </div>

          {/* Quick Pin Toggle Button */}
          {!isArchived && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note);
              }}
              title={isPinned ? 'Unpin note' : 'Pin note to top'}
              className={`p-1.5 rounded-lg transition-colors ${
                isPinned
                  ? 'text-amber-500 bg-amber-100/70 hover:bg-amber-200/70'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-60 group-hover:opacity-100'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
            </button>
          )}

          {isArchived && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
              <Archive className="w-3 h-3" />
              Archived
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-950 line-clamp-2 mb-2 tracking-tight">
          {note.title}
        </h3>

        {/* Snippet preview */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 flex-1">
          {previewSnippet || <span className="italic text-slate-400">Empty note</span>}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
            {tags.slice(0, 4).map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectTag) onSelectTag(tag);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60 transition-colors"
                title={`Filter by tag: ${tag}`}
              >
                <Tag className="w-2.5 h-2.5 opacity-50" />
                <span>{tag}</span>
              </button>
            ))}
            {tags.length > 4 && (
              <span className="text-[10px] font-semibold text-slate-400 self-center">
                +{tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Reminder date indicator if set */}
        {formattedReminder && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md mb-3 border ${
              isReminderOverdue
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200/70'
            }`}
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {isReminderOverdue ? 'Overdue reminder: ' : 'Reminder: '}
              {formattedReminder}
            </span>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="px-4 py-2.5 sm:px-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px] font-medium text-slate-400">
          Updated {formatRelativeTime(note.updated_at)}
        </span>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Edit button */}
          <button
            type="button"
            onClick={() => onEdit(note)}
            title="Edit note"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Archive / Restore button */}
          <button
            type="button"
            onClick={() => onToggleArchive(note)}
            title={isArchived ? 'Restore note to active' : 'Archive note'}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-colors"
          >
            {isArchived ? (
              <ArchiveRestore className="w-3.5 h-3.5" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => onDelete(note)}
            title="Delete note permanently"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
