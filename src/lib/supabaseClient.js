import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
};

// Helper function to get property image URL from Supabase Storage
export const getPropertyImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If it's already a full URL (like Unsplash), return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Otherwise, construct Supabase Storage URL
  const { data } = supabase.storage
    .from('property-images')
    .getPublicUrl(imagePath);

  return data.publicUrl;
};

// Helper function to upload property image to Supabase Storage
export const uploadPropertyImage = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    return filePath;
  } catch (error) {
    console.error('Error uploading image:', error.message);
    throw error;
  }
};

// ============================================
// Knowledge Base Helper Functions
// ============================================

/**
 * Fetch all notes for the current user
 */
export const fetchKBNotes = async (userId) => {
  const { data, error } = await supabase
    .from('kb_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error.message);
    throw error;
  }

  return data;
};

/**
 * Fetch a single note by ID
 */
export const fetchKBNote = async (noteId, userId) => {
  const { data, error } = await supabase
    .from('kb_notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching note:', error.message);
    throw error;
  }

  return data;
};

/**
 * Fetch notes by collection name
 * Supports 'all' to fetch all notes, or specific collection name
 */
export const fetchKBNotesByCollection = async (userId, collectionName) => {
  if (collectionName === 'all') {
    return fetchKBNotes(userId);
  }

  const { data, error } = await supabase
    .from('kb_notes')
    .select('*')
    .eq('user_id', userId)
    .or(`collection.eq.${collectionName},tags.cs.{${collectionName}}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes by collection:', error.message);
    throw error;
  }

  return data;
};

/**
 * Search notes by query (full-text search)
 */
export const searchKBNotes = async (userId, query) => {
  const { data, error } = await supabase.rpc('search_kb_notes', {
    p_user_id: userId,
    p_query: query,
  });

  if (error) {
    console.error('Error searching notes:', error.message);
    throw error;
  }

  return data;
};

/**
 * Create a new note
 */
export const createKBNote = async (userId, noteData) => {
  const { data, error } = await supabase
    .from('kb_notes')
    .insert({
      user_id: userId,
      title: noteData.title,
      content: noteData.content,
      tags: noteData.tags || [],
      collection: noteData.collection || null,
      metadata: noteData.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error.message);
    throw error;
  }

  return data;
};

/**
 * Update an existing note
 */
export const updateKBNote = async (noteId, userId, updates) => {
  const { data, error } = await supabase
    .from('kb_notes')
    .update(updates)
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error.message);
    throw error;
  }

  return data;
};

/**
 * Delete a note
 */
export const deleteKBNote = async (noteId, userId) => {
  const { error } = await supabase
    .from('kb_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting note:', error.message);
    throw error;
  }
};

/**
 * Save a summary to the database
 */
export const saveKBSummary = async (userId, summaryData) => {
  const { data, error } = await supabase
    .from('kb_summaries')
    .insert({
      user_id: userId,
      summary_type: summaryData.summary_type,
      note_id: summaryData.note_id || null,
      collection_name: summaryData.collection_name || null,
      summary_data: summaryData.summary_data,
      note_count: summaryData.note_count || 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving summary:', error.message);
    throw error;
  }

  return data;
};

/**
 * Fetch summaries for a user
 */
export const fetchKBSummaries = async (userId) => {
  const { data, error } = await supabase
    .from('kb_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching summaries:', error.message);
    throw error;
  }

  return data;
};

/**
 * Get all unique collections for a user
 */
export const getKBCollections = async (userId) => {
  const { data, error } = await supabase
    .from('kb_notes')
    .select('collection')
    .eq('user_id', userId)
    .not('collection', 'is', null);

  if (error) {
    console.error('Error fetching collections:', error.message);
    throw error;
  }

  // Extract unique collection names
  const collections = [...new Set(data.map(item => item.collection))];
  return collections.filter(Boolean);
};

/**
 * Get all unique tags for a user
 */
export const getKBTags = async (userId) => {
  const { data, error } = await supabase
    .from('kb_notes')
    .select('tags')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching tags:', error.message);
    throw error;
  }

  // Flatten and deduplicate tags
  const allTags = data.flatMap(item => item.tags || []);
  return [...new Set(allTags)];
};
