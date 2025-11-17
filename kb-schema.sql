-- Knowledge Base Schema for Supabase
-- This schema supports note storage, collections, and AI-powered summarization

-- Create kb_notes table
CREATE TABLE IF NOT EXISTS public.kb_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  collection TEXT, -- Collection name for grouping notes
  metadata JSONB DEFAULT '{}'::JSONB, -- Store source, author, date, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kb_summaries table to store generated summaries
CREATE TABLE IF NOT EXISTS public.kb_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('single', 'collection')),
  note_id UUID REFERENCES public.kb_notes(id) ON DELETE CASCADE, -- NULL for collection summaries
  collection_name TEXT, -- NULL for single note summaries
  summary_data JSONB NOT NULL, -- Store hierarchical summary, themes, contradictions, gaps
  note_count INTEGER DEFAULT 1, -- Number of notes included in summary
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kb_notes_user_id ON public.kb_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_notes_collection ON public.kb_notes(collection) WHERE collection IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_notes_tags ON public.kb_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_summaries_user_id ON public.kb_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_summaries_note_id ON public.kb_summaries(note_id) WHERE note_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_summaries_collection ON public.kb_summaries(collection_name) WHERE collection_name IS NOT NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to kb_notes
CREATE TRIGGER update_kb_notes_updated_at
  BEFORE UPDATE ON public.kb_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.kb_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_summaries ENABLE ROW LEVEL SECURITY;

-- kb_notes policies
CREATE POLICY "Users can view their own notes"
  ON public.kb_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.kb_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.kb_notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.kb_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- kb_summaries policies
CREATE POLICY "Users can view their own summaries"
  ON public.kb_summaries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries"
  ON public.kb_summaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries"
  ON public.kb_summaries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Helper function to get notes by collection
CREATE OR REPLACE FUNCTION public.get_notes_by_collection(
  p_user_id UUID,
  p_collection TEXT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  tags TEXT[],
  collection TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.tags,
    n.collection,
    n.metadata,
    n.created_at,
    n.updated_at
  FROM public.kb_notes n
  WHERE n.user_id = p_user_id
    AND (
      p_collection = 'all'
      OR n.collection = p_collection
      OR p_collection = ANY(n.tags)
    )
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to search notes by keywords
CREATE OR REPLACE FUNCTION public.search_kb_notes(
  p_user_id UUID,
  p_query TEXT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  tags TEXT[],
  collection TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.tags,
    n.collection,
    n.metadata,
    n.created_at,
    n.updated_at,
    ts_rank(
      to_tsvector('english', n.title || ' ' || n.content),
      plainto_tsquery('english', p_query)
    ) as relevance
  FROM public.kb_notes n
  WHERE n.user_id = p_user_id
    AND (
      to_tsvector('english', n.title || ' ' || n.content) @@ plainto_tsquery('english', p_query)
      OR n.title ILIKE '%' || p_query || '%'
      OR n.content ILIKE '%' || p_query || '%'
      OR p_query = ANY(n.tags)
    )
  ORDER BY relevance DESC, n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
