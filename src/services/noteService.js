import api from './api';

export const noteService = {
  getNotes: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search && params.search.trim()) query.append('search', params.search.trim());
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params.isPinned !== undefined && params.isPinned !== '') query.append('isPinned', params.isPinned);
    if (params.isArchived !== undefined && params.isArchived !== '') query.append('isArchived', params.isArchived);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const queryString = query.toString();
    const url = queryString ? `/notes?${queryString}` : '/notes';
    return await api.get(url);
  },

  getSummary: async () => {
    return await api.get('/notes/summary');
  },

  getNoteById: async (id) => {
    return await api.get(`/notes/${id}`);
  },

  createNote: async (data) => {
    return await api.post('/notes', data);
  },

  updateNote: async (id, data) => {
    return await api.put(`/notes/${id}`, data);
  },

  togglePin: async (id, isPinned) => {
    return await api.patch(`/notes/${id}/pin`, isPinned !== undefined ? { is_pinned: isPinned } : {});
  },

  toggleArchive: async (id, isArchived) => {
    return await api.patch(`/notes/${id}/archive`, isArchived !== undefined ? { is_archived: isArchived } : {});
  },

  deleteNote: async (id) => {
    return await api.delete(`/notes/${id}`);
  },
};

export default noteService;
