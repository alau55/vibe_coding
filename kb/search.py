"""Search functionality for the knowledge base."""

from typing import List, Tuple
from .models import Note


class SearchEngine:
    """Handles advanced search operations."""

    @staticmethod
    def rank_results(notes: List[Note], query: str) -> List[Tuple[Note, float]]:
        """
        Rank search results by relevance.

        Returns a list of (note, score) tuples sorted by relevance.
        """
        query_lower = query.lower()
        query_words = query_lower.split()

        ranked = []
        for note in notes:
            score = 0.0

            # Title matches are worth more
            title_lower = note.title.lower()
            if query_lower in title_lower:
                score += 10.0
            for word in query_words:
                if word in title_lower:
                    score += 3.0

            # Content matches
            content_lower = note.content.lower()
            content_count = content_lower.count(query_lower)
            score += content_count * 2.0

            for word in query_words:
                score += content_lower.count(word) * 0.5

            # Tag matches
            for tag in note.tags:
                tag_lower = tag.lower()
                if query_lower in tag_lower:
                    score += 5.0
                for word in query_words:
                    if word in tag_lower:
                        score += 2.0

            ranked.append((note, score))

        # Sort by score (highest first)
        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked

    @staticmethod
    def highlight_match(text: str, query: str, context_chars: int = 100) -> str:
        """
        Extract a snippet of text around the match with highlighting.

        Args:
            text: The text to search in
            query: The search query
            context_chars: Number of characters to show around the match

        Returns:
            A snippet with the match highlighted
        """
        text_lower = text.lower()
        query_lower = query.lower()

        index = text_lower.find(query_lower)
        if index == -1:
            # No match, return beginning of text
            return text[:context_chars] + ("..." if len(text) > context_chars else "")

        # Calculate snippet boundaries
        start = max(0, index - context_chars // 2)
        end = min(len(text), index + len(query) + context_chars // 2)

        snippet = text[start:end]

        # Add ellipsis if needed
        if start > 0:
            snippet = "..." + snippet
        if end < len(text):
            snippet = snippet + "..."

        return snippet

    @staticmethod
    def search_by_tags(notes: List[Note], tags: List[str]) -> List[Note]:
        """
        Filter notes that contain all specified tags.

        Args:
            notes: List of notes to filter
            tags: List of tags that must all be present

        Returns:
            Filtered list of notes
        """
        result = []
        tags_lower = [tag.lower() for tag in tags]

        for note in notes:
            note_tags_lower = [tag.lower() for tag in note.tags]
            if all(tag in note_tags_lower for tag in tags_lower):
                result.append(note)

        return result
