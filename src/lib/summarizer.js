/**
 * Knowledge Base Summarization Engine
 * Implements multi-step reasoning for note summarization:
 * 1. Retrieve all relevant notes
 * 2. Identify common themes
 * 3. Generate hierarchical summary
 * 4. Highlight contradictions or gaps
 */

/**
 * Extract key topics from note content using simple NLP techniques
 */
function extractKeywords(text) {
  // Remove common words (stop words)
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'might', 'may', 'can', 'to', 'of', 'in', 'for',
    'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'also', 'just', 'but',
    'if', 'or', 'because', 'as', 'until', 'while', 'this', 'that', 'these',
    'those', 'am', 'it', 'its', 'you', 'your', 'we', 'our', 'they', 'their',
    'use', 'using', 'used', 'example', 'examples', 'like', 'e.g', 'i.e'
  ]);

  // Extract words, filter stop words, count frequencies
  const words = text.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Step 1: Retrieve and prepare notes for analysis
 */
function prepareNotes(notes) {
  return notes.map(note => ({
    id: note.id,
    title: note.title,
    content: note.content,
    tags: note.tags || [],
    collection: note.collection,
    metadata: note.metadata || {},
    keywords: extractKeywords(note.title + ' ' + note.content),
    wordCount: note.content.split(/\s+/).length,
  }));
}

/**
 * Step 2: Identify common themes using clustering
 */
function identifyThemes(preparedNotes) {
  // Group by explicit tags first
  const tagGroups = {};
  preparedNotes.forEach(note => {
    note.tags.forEach(tag => {
      if (!tagGroups[tag]) {
        tagGroups[tag] = [];
      }
      tagGroups[tag].push(note);
    });
  });

  // Find keyword-based themes (words appearing in multiple notes)
  const keywordClusters = {};
  const allKeywords = new Set();

  preparedNotes.forEach(note => {
    note.keywords.forEach(keyword => {
      allKeywords.add(keyword);
    });
  });

  allKeywords.forEach(keyword => {
    const notesWithKeyword = preparedNotes.filter(note =>
      note.keywords.includes(keyword)
    );
    if (notesWithKeyword.length >= 2) {
      keywordClusters[keyword] = notesWithKeyword;
    }
  });

  // Build theme hierarchy
  const themes = [];

  // Tag-based themes
  Object.entries(tagGroups).forEach(([tag, notes]) => {
    if (notes.length >= 2) {
      themes.push({
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
        type: 'tag',
        notes: notes.map(n => n.title),
        noteCount: notes.length,
        keywords: [...new Set(notes.flatMap(n => n.keywords.slice(0, 5)))],
      });
    }
  });

  // Keyword-based themes (only if not already covered by tags)
  Object.entries(keywordClusters).forEach(([keyword, notes]) => {
    const existingTheme = themes.find(t =>
      t.keywords.includes(keyword) || t.name.toLowerCase().includes(keyword)
    );

    if (!existingTheme && notes.length >= 2) {
      themes.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        type: 'keyword',
        notes: notes.map(n => n.title),
        noteCount: notes.length,
        keywords: [keyword, ...notes[0].keywords.slice(0, 3).filter(k => k !== keyword)],
      });
    }
  });

  return themes.sort((a, b) => b.noteCount - a.noteCount);
}

/**
 * Step 3: Generate hierarchical summary
 */
function generateHierarchicalSummary(preparedNotes, themes) {
  const overview = generateOverview(preparedNotes);
  const themeDetails = themes.slice(0, 5).map(theme => {
    const themeNotes = preparedNotes.filter(n => theme.notes.includes(n.title));
    return {
      name: theme.name,
      notes: theme.notes,
      key_points: extractKeyPoints(themeNotes),
      coverage: `${theme.noteCount} of ${preparedNotes.length} notes`,
    };
  });

  return {
    overview,
    themes: themeDetails,
    metadata: {
      totalNotes: preparedNotes.length,
      totalWords: preparedNotes.reduce((sum, n) => sum + n.wordCount, 0),
      avgWordsPerNote: Math.round(
        preparedNotes.reduce((sum, n) => sum + n.wordCount, 0) / preparedNotes.length
      ),
      collections: [...new Set(preparedNotes.map(n => n.collection).filter(Boolean))],
    },
  };
}

/**
 * Generate overview text
 */
function generateOverview(notes) {
  const collections = [...new Set(notes.map(n => n.collection).filter(Boolean))];
  const topTags = getMostCommonTags(notes, 5);
  const difficulties = extractDifficulties(notes);

  let overview = `Collection of ${notes.length} notes`;

  if (collections.length > 0) {
    overview += ` across ${collections.length} collection${collections.length > 1 ? 's' : ''} (${collections.join(', ')})`;
  }

  if (topTags.length > 0) {
    overview += `. Main topics: ${topTags.join(', ')}`;
  }

  if (Object.keys(difficulties).length > 0) {
    const diffStr = Object.entries(difficulties)
      .map(([level, count]) => `${count} ${level}`)
      .join(', ');
    overview += `. Difficulty levels: ${diffStr}`;
  }

  return overview;
}

/**
 * Extract key points from a group of notes
 */
function extractKeyPoints(notes) {
  const points = [];

  // Extract first significant sentence from each note
  notes.slice(0, 3).forEach(note => {
    const sentences = note.content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);

    if (sentences.length > 0) {
      points.push(sentences[0]);
    }
  });

  // Add common patterns
  const commonKeywords = findCommonKeywords(notes);
  if (commonKeywords.length > 0) {
    points.push(`Common concepts: ${commonKeywords.slice(0, 5).join(', ')}`);
  }

  return points.slice(0, 4);
}

/**
 * Find common keywords across notes
 */
function findCommonKeywords(notes) {
  const keywordCounts = {};
  notes.forEach(note => {
    note.keywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
  });

  return Object.entries(keywordCounts)
    .filter(([_, count]) => count >= Math.min(2, notes.length))
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword);
}

/**
 * Get most common tags
 */
function getMostCommonTags(notes, limit = 5) {
  const tagCounts = {};
  notes.forEach(note => {
    (note.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * Extract difficulty levels from metadata
 */
function extractDifficulties(notes) {
  const difficulties = {};
  notes.forEach(note => {
    const difficulty = note.metadata?.difficulty;
    if (difficulty) {
      difficulties[difficulty] = (difficulties[difficulty] || 0) + 1;
    }
  });
  return difficulties;
}

/**
 * Step 4: Detect contradictions and gaps
 */
function detectContradictionsAndGaps(preparedNotes, themes) {
  const contradictions = detectContradictions(preparedNotes);
  const gaps = identifyGaps(preparedNotes, themes);

  return { contradictions, gaps };
}

/**
 * Detect potential contradictions by finding opposing terms
 */
function detectContradictions(notes) {
  const opposingPairs = [
    ['always', 'never'],
    ['best', 'worst'],
    ['recommended', 'discouraged'],
    ['fast', 'slow'],
    ['should', 'should not'],
    ['good', 'bad'],
    ['prefer', 'avoid'],
  ];

  const contradictions = [];

  // Look for notes mentioning opposing concepts about the same topic
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const note1 = notes[i];
      const note2 = notes[j];

      // Check if notes share topics
      const sharedKeywords = note1.keywords.filter(k => note2.keywords.includes(k));

      if (sharedKeywords.length >= 2) {
        // Check for opposing terms
        for (const [term1, term2] of opposingPairs) {
          const note1HasTerm1 = note1.content.toLowerCase().includes(term1);
          const note1HasTerm2 = note1.content.toLowerCase().includes(term2);
          const note2HasTerm1 = note2.content.toLowerCase().includes(term1);
          const note2HasTerm2 = note2.content.toLowerCase().includes(term2);

          if ((note1HasTerm1 && note2HasTerm2) || (note1HasTerm2 && note2HasTerm1)) {
            contradictions.push({
              notes: [note1.title, note2.title],
              topic: sharedKeywords[0],
              description: `Different perspectives on ${sharedKeywords[0]}`,
            });
            break;
          }
        }
      }
    }
  }

  return contradictions;
}

/**
 * Identify knowledge gaps
 */
function identifyGaps(notes, themes) {
  const gaps = [];

  // Check for single notes (no related content)
  const orphanNotes = notes.filter(note => {
    const relatedTheme = themes.find(theme => theme.notes.includes(note.title));
    return !relatedTheme || relatedTheme.noteCount === 1;
  });

  if (orphanNotes.length > 0) {
    gaps.push({
      type: 'isolated_topics',
      description: `${orphanNotes.length} notes have no related content`,
      examples: orphanNotes.slice(0, 3).map(n => n.title),
    });
  }

  // Check for missing difficulty levels
  const difficulties = extractDifficulties(notes);
  const expectedLevels = ['beginner', 'intermediate', 'advanced'];
  const missingLevels = expectedLevels.filter(level => !difficulties[level]);

  if (missingLevels.length > 0) {
    gaps.push({
      type: 'missing_difficulty_levels',
      description: `No ${missingLevels.join(' or ')} level content`,
    });
  }

  // Check for incomplete coverage in themes
  themes.forEach(theme => {
    if (theme.noteCount === 1) {
      gaps.push({
        type: 'shallow_coverage',
        description: `Topic "${theme.name}" only has one note`,
        suggestion: 'Consider adding more examples or details',
      });
    }
  });

  // Check for missing practical examples
  const notesWithExamples = notes.filter(note =>
    note.content.includes('example') ||
    note.content.includes('Example') ||
    note.content.includes('```') ||
    /\n\s*[a-z_]+\s*=/.test(note.content) // Code assignment pattern
  );

  if (notesWithExamples.length < notes.length * 0.5) {
    gaps.push({
      type: 'missing_examples',
      description: `Only ${notesWithExamples.length} of ${notes.length} notes contain code examples`,
      suggestion: 'Add more practical examples to improve understanding',
    });
  }

  return gaps;
}

/**
 * Main summarization function
 * @param {Array} notes - Array of note objects from database
 * @param {Object} options - Summarization options
 * @returns {Object} Complete summary with themes, contradictions, and gaps
 */
export function summarizeNotes(notes, options = {}) {
  if (!notes || notes.length === 0) {
    return {
      success: false,
      error: 'No notes provided for summarization',
    };
  }

  try {
    // Step 1: Retrieve and prepare notes
    const preparedNotes = prepareNotes(notes);

    // Step 2: Identify common themes
    const themes = identifyThemes(preparedNotes);

    // Step 3: Generate hierarchical summary
    const summary = generateHierarchicalSummary(preparedNotes, themes);

    // Step 4: Detect contradictions and gaps
    const { contradictions, gaps } = detectContradictionsAndGaps(preparedNotes, themes);

    // Combine all results
    return {
      success: true,
      summary: {
        ...summary,
        contradictions,
        gaps,
        difficulty_distribution: extractDifficulties(preparedNotes),
      },
      note_count: notes.length,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Summarization error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Summarize a single note
 * @param {Object} note - Single note object
 * @returns {Object} Summary of the note
 */
export function summarizeSingleNote(note) {
  if (!note) {
    return {
      success: false,
      error: 'No note provided',
    };
  }

  const prepared = prepareNotes([note])[0];

  return {
    success: true,
    summary: {
      title: note.title,
      overview: generateSingleNoteOverview(note),
      key_topics: prepared.keywords,
      word_count: prepared.wordCount,
      tags: note.tags || [],
      collection: note.collection,
      difficulty: note.metadata?.difficulty,
      main_points: extractMainPoints(note.content),
    },
    generated_at: new Date().toISOString(),
  };
}

/**
 * Generate overview for a single note
 */
function generateSingleNoteOverview(note) {
  const firstSentences = note.content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, 2);

  return firstSentences.join('. ') + (firstSentences.length > 0 ? '.' : '');
}

/**
 * Extract main points from note content
 */
function extractMainPoints(content) {
  const points = [];

  // Find bullet points or numbered lists
  const listItems = content.match(/^[\s]*[-*•]\s+(.+)$/gm) ||
                    content.match(/^[\s]*\d+\.\s+(.+)$/gm);

  if (listItems && listItems.length > 0) {
    points.push(...listItems.slice(0, 5).map(item =>
      item.replace(/^[\s]*[-*•\d.]+\s+/, '').trim()
    ));
  }

  // Find section headers (lines ending with :)
  const sections = content.match(/^(.+):$/gm);
  if (sections) {
    points.push(...sections.slice(0, 3).map(s => s.replace(':', '').trim()));
  }

  // If no structured content, extract first few sentences
  if (points.length === 0) {
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);
    points.push(...sentences.slice(0, 3));
  }

  return points.slice(0, 5);
}

export default {
  summarizeNotes,
  summarizeSingleNote,
};
