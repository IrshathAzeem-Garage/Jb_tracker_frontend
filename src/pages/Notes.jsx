import React, { useState, useEffect, useCallback } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  Archive,
  Filter,
  Grid,
  List,
  RefreshCw,
  X,
  Clock,
  AlertCircle,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { noteService } from '../services/noteService';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteListView } from '../components/notes/NoteListView';
import { NoteFormModal } from '../components/notes/NoteFormModal';
import { NoteDetailModal } from '../components/notes/NoteDetailModal';
import { MetricCard } from '../components/common/MetricCard';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { NOTE_CATEGORIES, NOTE_PRIORITIES } from '../components/notes/noteConstants';

export const Notes = () => {
  const { showToast } = useToast();

  // Primary data states
  const [notes, setNotes] = useState([]);
  const [summary, setSummary] = useState({
    totalNotes: 0,
    pinnedNotes: 0,
    archivedNotes: 0,
    allNotes: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 24,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pinned' | 'archived'
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'created' | 'title' | 'priority'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals
  const [formModal, setFormModal] = useState({ open: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, note: null });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    note: null,
    isDeleting: false,
  });

  // Fetch notes function
  const fetchNotes = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const isArchived = activeTab === 'archived' ? 'true' : 'false';
        const isPinned = activeTab === 'pinned' ? 'true' : undefined;

        const res = await noteService.getNotes({
          page,
          limit: pagination.limit,
          search,
          category,
          priority,
          isPinned,
          isArchived,
          sortBy,
        });

        if (res.success) {
          setNotes(res.data.notes || []);
          setPagination(res.data.pagination || { total: 0, page: 1, limit: 24, totalPages: 1 });
          if (res.data.summary) {
            setSummary(res.data.summary);
          }
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
        showToast(err.message || 'Failed to load business notes', 'error');
      } finally {
        setLoading(false);
      }
    },
    [activeTab, search, category, priority, sortBy, pagination.limit, showToast]
  );

  // Debounce search / filters trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchNotes]);

  // Actions
  const handleOpenCreate = () => {
    setFormModal({ open: true, data: null });
  };

  const handleOpenEdit = (note) => {
    setFormModal({ open: true, data: note });
  };

  const handleOpenView = (note) => {
    setDetailModal({ open: true, note });
  };

  const handleCloseDetail = () => {
    setDetailModal({ open: false, note: null });
  };

  const handleSaveNote = async (payload) => {
    setIsSubmitting(true);
    try {
      if (formModal.data && formModal.data.id) {
        // Update existing note
        const res = await noteService.updateNote(formModal.data.id, payload);
        if (res.success) {
          showToast('Note updated successfully', 'success');
          setFormModal({ open: false, data: null });
          // If detail modal was open for this note, update it
          if (detailModal.note && detailModal.note.id === formModal.data.id) {
            setDetailModal({ open: true, note: res.data });
          }
          fetchNotes(pagination.page);
        }
      } else {
        // Create new note
        const res = await noteService.createNote(payload);
        if (res.success) {
          showToast('Note created successfully', 'success');
          setFormModal({ open: false, data: null });
          fetchNotes(1);
        }
      }
    } catch (err) {
      console.error('Save note error:', err);
      showToast(err.message || 'Failed to save note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (note) => {
    try {
      const res = await noteService.togglePin(note.id, !note.is_pinned);
      if (res.success) {
        showToast(
          res.data.is_pinned ? 'Note pinned to top' : 'Note unpinned',
          'success'
        );
        // Update in-place to avoid full screen flicker
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, is_pinned: res.data.is_pinned } : n))
        );
        if (detailModal.note && detailModal.note.id === note.id) {
          setDetailModal((prev) => ({
            ...prev,
            note: { ...prev.note, is_pinned: res.data.is_pinned },
          }));
        }
        // Refresh summary
        setSummary((prev) => ({
          ...prev,
          pinnedNotes: res.data.is_pinned ? prev.pinnedNotes + 1 : Math.max(0, prev.pinnedNotes - 1),
        }));
      }
    } catch (err) {
      console.error('Toggle pin error:', err);
      showToast(err.message || 'Failed to pin note', 'error');
    }
  };

  const handleToggleArchive = async (note) => {
    try {
      const willArchive = !note.is_archived;
      const res = await noteService.toggleArchive(note.id, willArchive);
      if (res.success) {
        showToast(
          willArchive ? 'Note moved to archive' : 'Note restored to active notes',
          'success'
        );
        // Close detail modal if open
        if (detailModal.open && detailModal.note?.id === note.id) {
          setDetailModal({ open: false, note: null });
        }
        // Refetch to cleanly handle view shifts
        fetchNotes(pagination.page);
      }
    } catch (err) {
      console.error('Toggle archive error:', err);
      showToast(err.message || 'Failed to archive note', 'error');
    }
  };

  const handlePromptDelete = (note) => {
    setDeleteConfirm({ open: true, note, isDeleting: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.note) return;
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await noteService.deleteNote(deleteConfirm.note.id);
      if (res.success) {
        showToast('Note deleted permanently', 'success');
        setDeleteConfirm({ open: false, note: null, isDeleting: false });
        if (detailModal.open && detailModal.note?.id === deleteConfirm.note.id) {
          setDetailModal({ open: false, note: null });
        }
        fetchNotes(pagination.page);
      }
    } catch (err) {
      console.error('Delete note error:', err);
      showToast(err.message || 'Failed to delete note', 'error');
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Toggle checklist in detail view
  const handleToggleChecklist = async (note, lineIndex, newChecked) => {
    const lines = note.content.split('\n');
    if (lines[lineIndex]) {
      const line = lines[lineIndex];
      const match = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
      if (match) {
        const replacement = `- [${newChecked ? 'x' : ' '}] ${match[2]}`;
        lines[lineIndex] = replacement;
        const newContent = lines.join('\n');

        // Optimistically update
        const updatedNote = { ...note, content: newContent };
        setDetailModal((prev) => ({ ...prev, note: updatedNote }));
        setNotes((prev) => prev.map((n) => (n.id === note.id ? updatedNote : n)));

        try {
          await noteService.updateNote(note.id, { content: newContent });
        } catch (err) {
          console.error('Failed to sync checklist update:', err);
          showToast('Failed to update checklist item', 'error');
        }
      }
    }
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    category !== 'All' ||
    priority !== 'All' ||
    sortBy !== 'updated';

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setPriority('All');
    setSortBy('updated');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Business Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centralized hub for strategic ideas, client meeting minutes, operational tasks, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchNotes(pagination.page)}
            title="Refresh notes list"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Note</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <MetricCard
          title="Total Active Notes"
          value={summary.totalNotes}
          subtitle="Non-archived business notes"
          icon={FileText}
          badge={`${summary.allNotes} total`}
          badgeType="default"
        />

        <MetricCard
          title="Pinned Notes"
          value={summary.pinnedNotes}
          subtitle="Quick access high-priority items"
          icon={Pin}
          badge={summary.pinnedNotes > 0 ? 'High Focus' : 'None'}
          badgeType={summary.pinnedNotes > 0 ? 'warning' : 'default'}
        />

        <MetricCard
          title="Archived Notes"
          value={summary.archivedNotes}
          subtitle="Safely stored historical notes"
          icon={Archive}
          badge="Archived"
          badgeType="default"
        />
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'all'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Active Notes ({summary.totalNotes})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pinned')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'pinned'
                ? 'border-amber-500 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Pinned ({summary.pinnedNotes})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'archived'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived ({summary.archivedNotes})</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 mb-2 sm:mb-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Card Grid View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Dense List View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Category, Priority, Sort */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title, content, or tags..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-slate-50/50 focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-900 transition-all"
          >
            <option value="All">All Categories</option>
            {NOTE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-900 transition-all"
          >
            <option value="All">All Priorities</option>
            {NOTE_PRIORITIES.map((prio) => (
              <option key={prio} value={prio}>
                {prio}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-900 transition-all"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="title">Title (A-Z)</option>
            <option value="priority">Priority (High to Low)</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Notes Main Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-5 bg-white rounded-xl border border-slate-200/80 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-4 bg-slate-200 rounded w-8" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="space-y-1.5 pt-2">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
              <div className="flex gap-2 pt-3">
                <div className="h-4 bg-slate-100 rounded w-12" />
                <div className="h-4 bg-slate-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={
            activeTab === 'archived'
              ? 'No archived notes'
              : activeTab === 'pinned'
              ? 'No pinned notes'
              : hasActiveFilters
              ? 'No notes match your filters'
              : 'No business notes yet'
          }
          description={
            hasActiveFilters
              ? 'Try adjusting your search terms or clearing the selected filters.'
              : activeTab === 'archived'
              ? 'Notes you archive will appear here for safe keeping and reference.'
              : activeTab === 'pinned'
              ? 'Pin your high-priority notes for fast, prominent access at the top of your dashboard.'
              : 'Keep track of meeting minutes, supplier agreements, tasks, and company ideas.'
          }
          actionLabel={
            hasActiveFilters
              ? 'Clear Filters'
              : activeTab === 'all'
              ? '+ Create First Note'
              : null
          }
          onAction={hasActiveFilters ? resetFilters : handleOpenCreate}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onView={handleOpenView}
              onEdit={handleOpenEdit}
              onDelete={handlePromptDelete}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              onSelectTag={(tag) => setSearch(tag)}
            />
          ))}
        </div>
      ) : (
        <NoteListView
          notes={notes}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onDelete={handlePromptDelete}
          onTogglePin={handleTogglePin}
          onToggleArchive={handleToggleArchive}
          onSelectTag={(tag) => setSearch(tag)}
        />
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs text-slate-500">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} notes
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchNotes(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-800">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchNotes(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Note Modal */}
      <NoteFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, data: null })}
        onSave={handleSaveNote}
        initialData={formModal.data}
        isSubmitting={isSubmitting}
      />

      {/* Full Detail Reader Modal */}
      <NoteDetailModal
        isOpen={detailModal.open}
        note={detailModal.note}
        onClose={handleCloseDetail}
        onEdit={handleOpenEdit}
        onDelete={handlePromptDelete}
        onTogglePin={handleTogglePin}
        onToggleArchive={handleToggleArchive}
        onToggleChecklist={handleToggleChecklist}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        title="Delete Business Note"
        message={`Are you sure you want to permanently delete "${deleteConfirm.note?.title}"? This action cannot be undone.`}
        confirmText={deleteConfirm.isDeleting ? 'Deleting...' : 'Delete Note'}
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, note: null, isDeleting: false })}
      />
    </div>
  );
};

export default Notes;
