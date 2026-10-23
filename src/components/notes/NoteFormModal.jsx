import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Pin,
  Clock,
  Tag,
  AlertCircle,
  Eye,
  PenLine,
  Sparkles,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  NOTE_CATEGORIES,
  NOTE_PRIORITIES,
  SUGGESTED_TAGS,
  CATEGORY_STYLES,
  PRIORITY_STYLES,
} from './noteConstants';

export const NoteFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isSubmitting = false,
}) => {
  const isEditing = Boolean(initialData && initialData.id);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // UI tabs & validation
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [errors, setErrors] = useState({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const textareaRef = useRef(null);
  const titleInputRef = useRef(null);

  // Reset or initialize when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setCategory(initialData.category || 'General');
        setPriority(initialData.priority || 'Medium');
        setTags(Array.isArray(initialData.tags) ? [...initialData.tags] : []);
        // Format reminder for datetime-local input (YYYY-MM-DDTHH:mm)
        if (initialData.reminder_at) {
          const d = new Date(initialData.reminder_at);
          if (!isNaN(d.getTime())) {
            const pad = (n) => String(n).padStart(2, '0');
            const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setReminderAt(localStr);
          } else {
            setReminderAt('');
          }
        } else {
          setReminderAt('');
        }
        setIsPinned(Boolean(initialData.is_pinned));
      } else {
        setTitle('');
        setContent('');
        setCategory('General');
        setPriority('Medium');
        setTags([]);
        setReminderAt('');
        setIsPinned(false);
      }
      setTagInput('');
      setErrors({});
      setActiveTab('write');

      // Focus title
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, initialData]);

  // Check if form is dirty
  const isDirty = () => {
    if (!initialData) {
      return (
        title.trim() !== '' ||
        content.trim() !== '' ||
        tags.length > 0 ||
        reminderAt !== '' ||
        isPinned !== false ||
        category !== 'General' ||
        priority !== 'Medium'
      );
    }
    const initialReminder = initialData.reminder_at
      ? new Date(initialData.reminder_at).toISOString().slice(0, 16)
      : '';
    const currentReminder = reminderAt ? new Date(reminderAt).toISOString().slice(0, 16) : '';

    return (
      title !== (initialData.title || '') ||
      content !== (initialData.content || '') ||
      category !== (initialData.category || 'General') ||
      priority !== (initialData.priority || 'Medium') ||
      isPinned !== Boolean(initialData.is_pinned) ||
      JSON.stringify(tags) !== JSON.stringify(initialData.tags || []) ||
      currentReminder !== initialReminder
    );
  };

  const handleAttemptClose = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Keyboard shortcut ESC to close with confirmation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showDiscardConfirm) {
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, content, tags, reminderAt, isPinned, category, priority, showDiscardConfirm]);

  // Tag manipulation
  const handleAddTag = (rawTag) => {
    const trimmed = (rawTag || tagInput).trim();
    if (!trimmed) return;
    // Don't add duplicate
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Formatting toolbar insertion
  const insertFormatting = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent =
      content.substring(0, start) + replacement + content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  // Form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const validationErrors = {};
    if (!title.trim()) {
      validationErrors.title = 'Title is required';
    }
    if (!content.trim()) {
      validationErrors.content = 'Note content is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setActiveTab('write');
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      tags,
      reminder_at: reminderAt ? new Date(reminderAt).toISOString() : null,
      is_pinned: isPinned,
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={handleAttemptClose}
        />

        {/* Modal Dialog */}
        <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
          <div
            className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200/90 flex flex-col max-h-[92vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <PenLine className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {isEditing ? 'Edit Business Note' : 'Create Business Note'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Capture important details, meeting notes, tasks, or ideas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Pin toggle in header */}
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isPinned
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={isPinned ? 'Note will be pinned to top' : 'Pin to top of list'}
                >
                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{isPinned ? 'Pinned' : 'Pin Note'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors({ ...errors, title: null });
                  }}
                  placeholder="e.g. Q4 Packaging Supplier Negotiation & Rates"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.title
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/20'
                      : 'border-slate-300 focus:border-slate-900 focus:ring-slate-100 bg-white'
                  }`}
                  maxLength={255}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Category & Priority Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 transition-all"
                  >
                    {NOTE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {NOTE_PRIORITIES.map((prio) => {
                      const isSelected = priority === prio;
                      const style = PRIORITY_STYLES[prio];
                      return (
                        <button
                          key={prio}
                          type="button"
                          onClick={() => setPriority(prio)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                            isSelected
                              ? `${style.bg} ${style.text} ${style.border} shadow-sm ring-1 ring-current`
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {prio}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tags & Labels
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Type tag name and press Enter or comma..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80 transition-colors shrink-0"
                  >
                    + Add Tag
                  </button>
                </div>

                {/* Current tags */}
                {tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                    {tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-slate-400 hover:text-rose-500 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested quick tags */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
                  {SUGGESTED_TAGS.filter((s) => !tags.includes(s))
                    .slice(0, 4)
                    .map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddTag(sug)}
                        className="text-[11px] text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 transition-colors"
                      >
                        +{sug}
                      </button>
                    ))}
                </div>
              </div>

              {/* Optional Reminder Date & Time */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Reminder Date & Time <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  {reminderAt && (
                    <button
                      type="button"
                      onClick={() => setReminderAt('')}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Clear Reminder
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <input
                    type="datetime-local"
                    value={reminderAt}
                    onChange={(e) => setReminderAt(e.target.value)}
                    className="w-full sm:w-auto flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-slate-900"
                  />
                  {/* Quick shortcuts */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(9, 0, 0, 0);
                        const pad = (n) => String(n).padStart(2, '0');
                        setReminderAt(
                          `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T09:00`
                        );
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      Tomorrow 9 AM
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        nextWeek.setHours(10, 0, 0, 0);
                        const pad = (n) => String(n).padStart(2, '0');
                        setReminderAt(
                          `${nextWeek.getFullYear()}-${pad(nextWeek.getMonth() + 1)}-${pad(nextWeek.getDate())}T10:00`
                        );
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      Next Week
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Content Editor Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Content <span className="text-rose-500">*</span>
                  </label>

                  {/* Write vs Preview Tabs */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveTab('write')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        activeTab === 'write'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <PenLine className="w-3 h-3" />
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        activeTab === 'preview'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                </div>

                {activeTab === 'write' ? (
                  <div
                    className={`rounded-xl border overflow-hidden transition-all ${
                      errors.content
                        ? 'border-rose-300 ring-2 ring-rose-100'
                        : 'border-slate-300 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-100'
                    }`}
                  >
                    {/* Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-1.5 bg-slate-50 border-b border-slate-200 flex-wrap">
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**', 'bold text')}
                        title="Bold (Ctrl+B)"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*', 'italic text')}
                        title="Italic"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('# ', '', 'Heading 1')}
                        title="Heading 1"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Heading1 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('## ', '', 'Heading 2')}
                        title="Heading 2"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('- ', '', 'Bullet item')}
                        title="Bullet List"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('1. ', '', 'Numbered item')}
                        title="Numbered List"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('- [ ] ', '', 'Task item')}
                        title="Checklist Task"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('> ', '', 'Important note or quote')}
                        title="Quote"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('`', '`', 'code')}
                        title="Inline Code"
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        if (errors.content) setErrors({ ...errors, content: null });
                      }}
                      placeholder="Write your note here... Use the toolbar above for headings, checklists, and bullet points."
                      rows={10}
                      className="w-full p-3.5 text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none resize-y leading-relaxed bg-white"
                    />
                  </div>
                ) : (
                  <div className="min-h-[260px] p-4 rounded-xl border border-slate-300 bg-slate-50/50 overflow-y-auto max-h-[360px]">
                    <MarkdownRenderer content={content} readOnly={true} />
                  </div>
                )}

                {errors.content && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.content}
                  </p>
                )}
              </div>
            </form>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/90 border-t border-slate-200">
              <span className="text-xs text-slate-400">
                {title.length}/255 chars
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Update Note' : 'Save Note'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discard confirmation modal */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this note. Are you sure you want to discard them? Any unsaved edits will be lost."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmVariant="danger"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
};

export default NoteFormModal;
