# Knowledge Base Summarization Feature

A powerful AI-driven knowledge base system with multi-step reasoning for note management and intelligent summarization.

## Overview

This feature adds a complete knowledge base system to the application with:
- Note creation, storage, and organization
- Collection-based note grouping
- Tag-based categorization
- AI-powered multi-step summarization
- Theme identification
- Knowledge gap detection
- Contradiction highlighting

## Features

### 1. Note Management
- Create and store notes with rich text content
- Organize notes into collections (e.g., "python", "javascript", "database")
- Tag notes for flexible categorization
- Search across all notes
- Filter by collection or tags

### 2. AI-Powered Summarization

#### Single Note Summary
Command-like usage: `kb summarize <note-id>`

The summarizer analyzes individual notes and provides:
- Key topics extraction
- Main points identification
- Word count and metadata
- Difficulty level (if specified)

#### Collection Summary
Command-like usage: `kb summarize --collection "python notes"`

Multi-step reasoning process:
1. **Retrieve**: Fetches all relevant notes from the collection
2. **Identify Themes**: Groups notes by common topics and keywords
3. **Hierarchical Summary**: Generates structured overview with:
   - Theme-based organization
   - Key points per theme
   - Coverage metrics
   - Difficulty distribution
4. **Detect Gaps & Contradictions**:
   - Identifies missing topics
   - Highlights isolated notes
   - Detects conflicting information
   - Suggests areas for improvement

## Database Schema

### Tables Created

#### `kb_notes`
Stores all user notes with:
- `id`: Unique identifier (UUID)
- `user_id`: Owner reference
- `title`: Note title
- `content`: Full note content (supports markdown)
- `tags`: Array of tags
- `collection`: Collection name
- `metadata`: JSONB field for custom data (difficulty, source, etc.)
- `created_at`, `updated_at`: Timestamps

#### `kb_summaries`
Stores generated summaries:
- `id`: Unique identifier
- `user_id`: Owner reference
- `summary_type`: 'single' or 'collection'
- `note_id`: Reference to note (for single summaries)
- `collection_name`: Collection name (for collection summaries)
- `summary_data`: JSONB with full summary results
- `note_count`: Number of notes in summary
- `created_at`: Generation timestamp

### Helper Functions

PostgreSQL functions for advanced queries:
- `get_notes_by_collection()`: Retrieve notes by collection name
- `search_kb_notes()`: Full-text search across notes

## Installation & Setup

### 1. Run Database Migrations

Execute the schema and seed data in your Supabase project:

```bash
# Run schema creation
psql -h your-supabase-host -U postgres -d postgres -f kb-schema.sql

# Optional: Load sample data
psql -h your-supabase-host -U postgres -d postgres -f kb-seed-data.sql
```

Or use the Supabase SQL Editor:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy contents of `kb-schema.sql` and execute
4. (Optional) Copy contents of `kb-seed-data.sql` and execute

### 2. Update Environment Variables

No additional environment variables needed - uses existing Supabase configuration.

### 3. Start the Development Server

```bash
npm install  # Install any missing dependencies
npm run dev  # Start Vite dev server
```

## Usage Guide

### Creating Notes

1. Navigate to the Knowledge Base page (http://localhost:5173/kb)
2. Click "New Note"
3. Fill in:
   - **Title**: Note title
   - **Content**: Full note content (supports markdown)
   - **Collection**: Group name (e.g., "python", "javascript")
   - **Tags**: Comma-separated tags (e.g., "tutorial, best-practices, advanced")
4. Click "Create Note"

### Organizing Notes

**Collections**: Broad categories for grouping related notes
- Example: "python", "javascript", "database", "react"

**Tags**: Fine-grained categorization
- Example: "async", "decorators", "best-practices", "performance"

**Metadata**: Additional structured data (added via form or directly)
```json
{
  "difficulty": "intermediate",
  "source": "official docs",
  "last_reviewed": "2025-01-15"
}
```

### Summarizing Notes

#### Single Note Summary
1. Find a note in the list
2. Click "Summarize" button on the note card
3. View AI-generated summary with:
   - Key topics
   - Main points
   - Metadata overview

#### Collection Summary
1. Select a collection from the dropdown (or choose "All Collections")
2. Click "Summarize [collection-name]" button
3. View comprehensive summary with:
   - Overview of entire collection
   - Common themes identified across notes
   - Key points per theme
   - Difficulty distribution
   - Knowledge gaps
   - Potential contradictions

### Understanding Summary Results

#### Themes
Automatically identified groups of related notes based on:
- Shared tags
- Common keywords
- Topic overlap

Example:
```
Theme: "Asynchronous Programming"
Notes: Python async/await, JavaScript Promises, React useEffect
Key Points:
- Use for I/O-bound operations
- Different syntax across languages
- Careful with error handling
```

#### Knowledge Gaps
Identified missing areas in your knowledge base:
- Isolated topics (only one note)
- Missing difficulty levels
- Shallow coverage
- Missing code examples

Example:
```
Gap: "No beginner level content"
Suggestion: Add introductory notes for new learners
```

#### Contradictions
Detected conflicting information across notes:
- Opposing recommendations
- Different best practices
- Version differences

Example:
```
Contradiction: Different perspectives on "async patterns"
Notes: "Python async/await Pattern", "JavaScript Promises"
Topic: async
```

## Implementation Details

### Multi-Step Reasoning Algorithm

The summarization engine (`src/lib/summarizer.js`) implements:

1. **Keyword Extraction**
   - Removes stop words
   - Counts word frequencies
   - Identifies top keywords per note

2. **Theme Identification**
   - Groups notes by shared tags
   - Clusters by common keywords
   - Builds hierarchical theme structure

3. **Summary Generation**
   - Creates overview from metadata
   - Extracts key points from content
   - Calculates statistics
   - Organizes information hierarchically

4. **Gap & Contradiction Detection**
   - Finds isolated notes
   - Checks for missing difficulty levels
   - Detects opposing terms in related notes
   - Identifies shallow coverage

### API Functions

Key functions from `src/lib/supabaseClient.js`:

```javascript
// Note operations
fetchKBNotes(userId)
fetchKBNote(noteId, userId)
fetchKBNotesByCollection(userId, collectionName)
searchKBNotes(userId, query)
createKBNote(userId, noteData)
updateKBNote(noteId, userId, updates)
deleteKBNote(noteId, userId)

// Summary operations
saveKBSummary(userId, summaryData)
fetchKBSummaries(userId)

// Utility
getKBCollections(userId)
getKBTags(userId)
```

### React Components

**Pages:**
- `KnowledgeBase.jsx`: Main KB page with note listing and management

**Components:**
- `NoteSummarizer.jsx`: Summary generation and display UI

**Libraries:**
- `summarizer.js`: Multi-step reasoning engine

## Sample Data

The seed data (`kb-seed-data.sql`) includes:
- 5 Python notes (list comprehensions, decorators, async/await, type hints, context managers)
- 1 JavaScript note (async/await)
- 1 PostgreSQL note (JSONB vs JSON)
- 1 React note (hooks best practices)
- 1 pre-generated collection summary for Python notes

This demonstrates:
- Different collections
- Varied difficulty levels
- Overlapping themes (async in Python and JavaScript)
- Potential contradictions (JSONB recommendations)
- Knowledge gaps (missing testing notes)

## Command-Line Style Usage

While this is a web application, the UI is designed to mimic CLI commands:

### Conceptual Commands

```bash
# View all notes
kb list

# Search notes
kb search "async"

# Filter by collection
kb list --collection python

# Summarize single note
kb summarize <note-id>

# Summarize collection
kb summarize --collection "python"
kb summarize --collection "all"  # All notes
```

### Actual Web Usage

1. Navigate to `/kb`
2. Use search box for `kb search`
3. Use collection dropdown for `--collection` flag
4. Click "Summarize" buttons for summarization

## Technical Architecture

```
Frontend (React)
    ↓
KB Components (KnowledgeBase.jsx, NoteSummarizer.jsx)
    ↓
Supabase Client Helpers (src/lib/supabaseClient.js)
    ↓
Summarization Engine (src/lib/summarizer.js)
    ↓
Supabase (PostgreSQL + RLS)
```

### Security

All data is protected by Row Level Security (RLS):
- Users can only access their own notes
- All CRUD operations enforce user ownership
- Helper functions use SECURITY DEFINER with proper checks

## Future Enhancements

Potential improvements:
1. **External AI Integration**: Use OpenAI/Anthropic for better summarization
2. **Export Summaries**: PDF, Markdown, or JSON export
3. **Note Linking**: Create relationships between notes
4. **Version History**: Track note edits over time
5. **Collaboration**: Share notes with other users
6. **Spaced Repetition**: Review scheduling based on summaries
7. **Mind Maps**: Visual representation of themes
8. **CLI Tool**: Actual command-line interface using Node.js

## Troubleshooting

### Database Connection Issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Check Supabase project is running

### Schema Errors
- Ensure schema was executed successfully
- Check for existing tables with same names
- Verify user has proper permissions

### Summarization Not Working
- Check browser console for errors
- Verify notes exist in the collection
- Ensure user is authenticated

### Performance Issues
- Create indexes if dealing with >1000 notes
- Consider pagination for large collections
- Optimize keyword extraction for very long notes

## Contributing

To extend this feature:

1. **Add New Summary Types**: Modify `summarizer.js`
2. **Enhance Theme Detection**: Improve clustering algorithm
3. **Add Visualizations**: Create charts for theme distribution
4. **Improve NLP**: Use better keyword extraction libraries

## License

Same as parent project.

## Contact

For issues or questions, refer to the main project documentation.
