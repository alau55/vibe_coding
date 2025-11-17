import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchKBNotes,
  getKBCollections,
  getKBTags,
  createKBNote,
  deleteKBNote,
} from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import NoteSummarizer from '../components/NoteSummarizer';

const KnowledgeBase = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showSummarizer, setShowSummarizer] = useState(false);
  const [summarizerMode, setSummarizerMode] = useState('collection'); // 'single' or 'collection'
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  // New note form state
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    collection: '',
    tags: '',
  });

  useEffect(() => {
    if (user) {
      loadKBData();
    }
  }, [user]);

  const loadKBData = async () => {
    try {
      setLoading(true);
      const [notesData, collectionsData, tagsData] = await Promise.all([
        fetchKBNotes(user.id),
        getKBCollections(user.id),
        getKBTags(user.id),
      ]);
      setNotes(notesData);
      setCollections(collectionsData);
      setTags(tagsData);
    } catch (error) {
      console.error('Error loading KB data:', error);
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();

    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const tagArray = noteForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      await createKBNote(user.id, {
        title: noteForm.title,
        content: noteForm.content,
        collection: noteForm.collection || null,
        tags: tagArray,
        metadata: {},
      });

      toast.success('Note created successfully');
      setNoteForm({ title: '', content: '', collection: '', tags: '' });
      setShowNoteForm(false);
      loadKBData();
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await deleteKBNote(noteId, user.id);
      toast.success('Note deleted');
      loadKBData();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesCollection =
      selectedCollection === 'all' ||
      note.collection === selectedCollection ||
      (note.tags || []).includes(selectedCollection);

    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags || []).some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesCollection && matchesSearch;
  });

  const handleSummarizeNote = (noteId) => {
    setSelectedNoteId(noteId);
    setSummarizerMode('single');
    setShowSummarizer(true);
  };

  const handleSummarizeCollection = () => {
    setSummarizerMode('collection');
    setShowSummarizer(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in</h2>
          <p className="text-gray-600">
            You need to be logged in to access the knowledge base.
          </p>
        </div>
      </div>
    );
  }

  if (showSummarizer) {
    return (
      <NoteSummarizer
        mode={summarizerMode}
        noteId={selectedNoteId}
        collectionName={selectedCollection}
        onBack={() => {
          setShowSummarizer(false);
          setSelectedNoteId(null);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Knowledge Base</h1>
            <p className="text-gray-600">
              Manage and summarize your notes with AI-powered insights
            </p>
          </div>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {showNoteForm ? 'Cancel' : 'New Note'}
          </button>
        </div>

        {/* New Note Form */}
        {showNoteForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New Note</h2>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter note title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, content: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter note content (supports markdown)"
                  rows={10}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection
                  </label>
                  <input
                    type="text"
                    value={noteForm.collection}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, collection: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., python, javascript"
                    list="collections-list"
                  />
                  <datalist id="collections-list">
                    {collections.map(col => (
                      <option key={col} value={col} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={noteForm.tags}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, tags: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., tutorial, best-practices, advanced"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteForm(false);
                    setNoteForm({ title: '', content: '', collection: '', tags: '' });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Create Note
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search notes..."
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Collections</option>
                {collections.map(collection => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSummarizeCollection}
                disabled={filteredNotes.length === 0}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Summarize {selectedCollection === 'all' ? 'All' : selectedCollection}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Notes</div>
            <div className="text-3xl font-bold">{notes.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Collections</div>
            <div className="text-3xl font-bold">{collections.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Tags</div>
            <div className="text-3xl font-bold">{tags.length}</div>
          </div>
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">
              {notes.length === 0
                ? 'No notes yet. Create your first note to get started!'
                : 'No notes match your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">
                    {note.title}
                  </h3>

                  {note.collection && (
                    <div className="mb-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {note.collection}
                      </span>
                    </div>
                  )}

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {note.content}
                  </p>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    Created: {new Date(note.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSummarizeNote(note.id)}
                      className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Summarize
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="px-3 py-2 border border-red-300 hover:bg-red-50 text-red-600 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
