import React from 'react';
import {
  Pin,
  Archive,
  ArchiveRestore,
  Edit2,
  Trash2,
  Clock,
  Eye,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters';
import { CATEGORY_STYLES, PRIORITY_STYLES } from './noteConstants';

export const NoteListView = ({
  notes = [],
  onView,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onSelectTag,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4 w-12 text-center">Pin</th>
              <th className="py-3 px-4">Title & Preview</th>
              <th className="py-3 px-4 w-32">Category</th>
              <th className="py-3 px-4 w-24">Priority</th>
              <th className="py-3 px-4 w-40">Reminder</th>
              <th className="py-3 px-4 w-32">Updated</th>
              <th className="py-3 px-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {notes.map((note) => {
              const isPinned = note.is_pinned;
              const isArchived = note.is_archived;
              const categoryStyle = CATEGORY_STYLES[note.category] || CATEGORY_STYLES.General;
              const priorityStyle = PRIORITY_STYLES[note.priority] || PRIORITY_STYLES.Medium;
              const tags = Array.isArray(note.tags) ? note.tags : [];

              return (
                <tr
                  key={note.id}
                  onClick={() => onView(note)}
                  className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                    isPinned ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* Pin button */}
                  <td
                    className="py-3 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isArchived ? (
                      <button
                        type="button"
                        onClick={() => onTogglePin(note)}
                        title={isPinned ? 'Unpin note' : 'Pin note to top'}
                        className={`p-1 rounded-md transition-colors ${
                          isPinned
                            ? 'text-amber-500 bg-amber-100/70 hover:bg-amber-200/70'
                            : 'text-slate-300 hover:text-slate-600'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                      </button>
                    ) : (
                      <Archive className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                    )}
                  </td>

                  {/* Title & Preview */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col min-w-0 max-w-md">
                      <span className="font-semibold text-slate-900 truncate">
                        {note.title}
                      </span>
                      <span className="text-xs text-slate-500 truncate mt-0.5">
                        {note.content.substring(0, 90)}
                      </span>
                      {tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectTag) onSelectTag(tag);
                              }}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              <Tag className="w-2 h-2 opacity-50" />
                              {tag}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
                      {note.category}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                    >
                      {note.priority === 'High' && <AlertCircle className="w-3 h-3" />}
                      {note.priority}
                    </span>
                  </td>

                  {/* Reminder */}
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {note.reminder_at ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formatDateTime(note.reminder_at)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Updated */}
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatRelativeTime(note.updated_at)}
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onView(note)}
                        title="View full note"
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(note)}
                        title="Edit note"
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleArchive(note)}
                        title={isArchived ? 'Restore note' : 'Archive note'}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        {isArchived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(note)}
                        title="Delete note"
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NoteListView;
