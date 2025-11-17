"""Data models for the knowledge base."""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional


@dataclass
class Note:
    """Represents a knowledge base note."""

    id: str
    title: str
    content: str
    tags: List[str]
    created_at: datetime
    modified_at: datetime
    file_path: str

    def to_dict(self):
        """Convert note to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'tags': self.tags,
            'created_at': self.created_at.isoformat(),
            'modified_at': self.modified_at.isoformat(),
            'file_path': self.file_path
        }

    @classmethod
    def from_dict(cls, data):
        """Create note from dictionary."""
        return cls(
            id=data['id'],
            title=data['title'],
            content=data['content'],
            tags=data['tags'],
            created_at=datetime.fromisoformat(data['created_at']),
            modified_at=datetime.fromisoformat(data['modified_at']),
            file_path=data['file_path']
        )


@dataclass
class NoteLink:
    """Represents a link between two notes."""

    id: int
    source_note_id: str
    target_note_id: str
    reason: str
    created_at: datetime

    def to_dict(self):
        """Convert link to dictionary."""
        return {
            'id': self.id,
            'source_note_id': self.source_note_id,
            'target_note_id': self.target_note_id,
            'reason': self.reason,
            'created_at': self.created_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data):
        """Create link from dictionary."""
        return cls(
            id=data['id'],
            source_note_id=data['source_note_id'],
            target_note_id=data['target_note_id'],
            reason=data['reason'],
            created_at=datetime.fromisoformat(data['created_at'])
        )
