import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchKBNote,
  fetchKBNotesByCollection,
  saveKBSummary,
} from '../lib/supabaseClient';
import { summarizeNotes, summarizeSingleNote } from '../lib/summarizer';
import toast from 'react-hot-toast';

const NoteSummarizer = ({ mode, noteId, collectionName, onBack }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      generateSummary();
    }
  }, [user, mode, noteId, collectionName]);

  const generateSummary = async () => {
    try {
      setLoading(true);
      setSummarizing(true);
      setError(null);

      let result;

      if (mode === 'single') {
        // Step 1: Retrieve single note
        toast.loading('Retrieving note...', { id: 'summarize' });
        const note = await fetchKBNote(noteId, user.id);

        // Step 2-4: Generate summary using multi-step reasoning
        toast.loading('Analyzing content and generating summary...', { id: 'summarize' });
        result = summarizeSingleNote(note);

        if (result.success) {
          // Save summary to database
          await saveKBSummary(user.id, {
            summary_type: 'single',
            note_id: noteId,
            summary_data: result.summary,
            note_count: 1,
          });

          toast.success('Summary generated successfully!', { id: 'summarize' });
          setSummary(result);
        } else {
          throw new Error(result.error);
        }
      } else {
        // Collection mode - Multi-step reasoning
        // Step 1: Retrieve all relevant notes
        toast.loading('Retrieving notes from collection...', { id: 'summarize' });
        const notes = await fetchKBNotesByCollection(user.id, collectionName);

        if (notes.length === 0) {
          throw new Error('No notes found in this collection');
        }

        // Step 2: Identify common themes
        toast.loading(`Analyzing ${notes.length} notes and identifying themes...`, {
          id: 'summarize',
        });

        // Step 3: Generate hierarchical summary
        // Step 4: Highlight contradictions and gaps
        toast.loading('Generating summary and detecting gaps...', { id: 'summarize' });
        result = summarizeNotes(notes);

        if (result.success) {
          // Save summary to database
          await saveKBSummary(user.id, {
            summary_type: 'collection',
            collection_name: collectionName,
            summary_data: result.summary,
            note_count: notes.length,
          });

          toast.success(
            `Summary generated for ${notes.length} notes!`,
            { id: 'summarize' }
          );
          setSummary(result);
        } else {
          throw new Error(result.error);
        }
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message);
      toast.error(`Failed to generate summary: ${err.message}`, { id: 'summarize' });
    } finally {
      setLoading(false);
      setSummarizing(false);
    }
  };

  const renderSingleNoteSummary = () => {
    const data = summary.summary;

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
          <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
          <p className="text-gray-700">{data.overview}</p>
        </div>

        {/* Key Topics */}
        {data.key_topics && data.key_topics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">Key Topics</h3>
            <div className="flex flex-wrap gap-2">
              {data.key_topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Points */}
        {data.main_points && data.main_points.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">Main Points</h3>
            <ul className="space-y-2">
              {data.main_points.map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Metadata</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Word Count</div>
              <div className="text-2xl font-bold">{data.word_count || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Collection</div>
              <div className="text-2xl font-bold">{data.collection || 'None'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Difficulty</div>
              <div className="text-2xl font-bold">
                {data.difficulty || 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Tags</div>
              <div className="text-2xl font-bold">{data.tags?.length || 0}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCollectionSummary = () => {
    const data = summary.summary;

    return (
      <div className="space-y-6">
        {/* Overview */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
          <h2 className="text-2xl font-bold mb-2">
            Collection: {collectionName === 'all' ? 'All Notes' : collectionName}
          </h2>
          <p className="text-gray-700 text-lg">{data.overview}</p>
        </div>

        {/* Metadata Stats */}
        {data.metadata && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Total Notes</div>
              <div className="text-3xl font-bold text-blue-600">
                {data.metadata.totalNotes}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Total Words</div>
              <div className="text-3xl font-bold text-green-600">
                {data.metadata.totalWords?.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Avg Words/Note</div>
              <div className="text-3xl font-bold text-purple-600">
                {data.metadata.avgWordsPerNote}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Collections</div>
              <div className="text-3xl font-bold text-orange-600">
                {data.metadata.collections?.length || 0}
              </div>
            </div>
          </div>
        )}

        {/* Themes */}
        {data.themes && data.themes.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold mb-4">Common Themes</h3>
            <div className="space-y-6">
              {data.themes.map((theme, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-xl font-bold mb-2">{theme.name}</h4>
                  <div className="text-sm text-gray-600 mb-2">
                    {theme.coverage}
                  </div>
                  <div className="mb-3">
                    <strong className="text-sm text-gray-700">Notes:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {theme.notes.map((note, noteIdx) => (
                        <span
                          key={noteIdx}
                          className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                  {theme.key_points && theme.key_points.length > 0 && (
                    <div>
                      <strong className="text-sm text-gray-700">Key Points:</strong>
                      <ul className="mt-1 space-y-1">
                        {theme.key_points.map((point, pointIdx) => (
                          <li key={pointIdx} className="text-sm text-gray-600 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Distribution */}
        {data.difficulty_distribution &&
          Object.keys(data.difficulty_distribution).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold mb-4">Difficulty Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(data.difficulty_distribution).map(([level, count]) => (
                  <div key={level} className="text-center">
                    <div className="text-sm text-gray-600 capitalize mb-1">
                      {level}
                    </div>
                    <div className="text-3xl font-bold">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Contradictions */}
        {data.contradictions && data.contradictions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <h3 className="text-2xl font-bold mb-4 text-yellow-700">
              Potential Contradictions
            </h3>
            <div className="space-y-4">
              {data.contradictions.map((contradiction, idx) => (
                <div key={idx} className="bg-yellow-50 p-4 rounded">
                  <div className="font-medium text-gray-800 mb-2">
                    {contradiction.description}
                  </div>
                  <div className="text-sm text-gray-600">
                    Notes: {contradiction.notes.join(', ')}
                  </div>
                  {contradiction.topic && (
                    <div className="text-sm text-gray-600 mt-1">
                      Topic: <span className="font-medium">{contradiction.topic}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Gaps */}
        {data.gaps && data.gaps.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 className="text-2xl font-bold mb-4 text-red-700">
              Knowledge Gaps
            </h3>
            <div className="space-y-4">
              {data.gaps.map((gap, idx) => (
                <div key={idx} className="bg-red-50 p-4 rounded">
                  <div className="font-medium text-gray-800 mb-2">
                    {gap.description}
                  </div>
                  {gap.type && (
                    <div className="text-sm text-gray-600 mb-1">
                      Type: <span className="font-medium">{gap.type.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {gap.examples && gap.examples.length > 0 && (
                    <div className="text-sm text-gray-600 mb-1">
                      Examples: {gap.examples.join(', ')}
                    </div>
                  )}
                  {gap.suggestion && (
                    <div className="text-sm text-blue-600 mt-2">
                      💡 {gap.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {mode === 'single' ? 'Note Summary' : 'Collection Summary'}
            </h1>
            <p className="text-gray-600">
              {mode === 'single'
                ? 'AI-powered analysis of your note'
                : 'Multi-step reasoning with theme identification, hierarchical summary, and gap detection'}
            </p>
          </div>
          <button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
            <h2 className="text-xl font-bold mb-2">Generating Summary...</h2>
            <p className="text-gray-600">
              {mode === 'single'
                ? 'Analyzing note content...'
                : 'Processing notes, identifying themes, and detecting gaps...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
            <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={generateSummary}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Summary Display */}
        {summary && !loading && !error && (
          <>
            {mode === 'single' ? renderSingleNoteSummary() : renderCollectionSummary()}

            {/* Generation Info */}
            <div className="mt-8 bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
              Summary generated at {new Date(summary.generated_at).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoteSummarizer;
