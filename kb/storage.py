"""Storage layer for the knowledge base using SQLite."""

import sqlite3
import os
import json
from datetime import datetime
from typing import List, Optional
from pathlib import Path
import uuid

from .models import Note, NoteLink


class KnowledgeBaseStorage:
    """Handles all database operations for the knowledge base."""

    def __init__(self, db_path: str = None, notes_dir: str = None):
        """Initialize storage with database and notes directory paths."""
        if db_path is None:
            db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'kb.db')
        if notes_dir is None:
            notes_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'notes')

        self.db_path = db_path
        self.notes_dir = notes_dir

        # Ensure directories exist
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        os.makedirs(self.notes_dir, exist_ok=True)

        self._init_database()

    def _init_database(self):
        """Initialize the database schema."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create notes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                tags TEXT NOT NULL,
                file_path TEXT NOT NULL,
                created_at TEXT NOT NULL,
                modified_at TEXT NOT NULL
            )
        ''')

        # Create links table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS note_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_note_id TEXT NOT NULL,
                target_note_id TEXT NOT NULL,
                reason TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (source_note_id) REFERENCES notes (id),
                FOREIGN KEY (target_note_id) REFERENCES notes (id)
            )
        ''')

        # Create indexes for better search performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes(tags)
        ''')

        conn.commit()
        conn.close()

    def add_note(self, content: str, tags: List[str]) -> Note:
        """Add a new note to the knowledge base."""
        note_id = str(uuid.uuid4())[:8]  # Short UUID
        now = datetime.now()

        # Extract title from first line or create a default one
        lines = content.strip().split('\n')
        title = lines[0][:100] if lines else f"Note {note_id}"

        # Create markdown file
        file_name = f"{note_id}.md"
        file_path = os.path.join(self.notes_dir, file_name)

        # Write content to file
        with open(file_path, 'w') as f:
            f.write(content)

        # Save metadata to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO notes (id, title, tags, file_path, created_at, modified_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (note_id, title, json.dumps(tags), file_path, now.isoformat(), now.isoformat()))

        conn.commit()
        conn.close()

        return Note(
            id=note_id,
            title=title,
            content=content,
            tags=tags,
            created_at=now,
            modified_at=now,
            file_path=file_path
        )

    def get_note(self, note_id: str) -> Optional[Note]:
        """Retrieve a note by ID."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, title, tags, file_path, created_at, modified_at
            FROM notes WHERE id = ?
        ''', (note_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        # Read content from file
        try:
            with open(row[3], 'r') as f:
                content = f.read()
        except FileNotFoundError:
            content = "[Content file not found]"

        return Note(
            id=row[0],
            title=row[1],
            content=content,
            tags=json.loads(row[2]),
            created_at=datetime.fromisoformat(row[4]),
            modified_at=datetime.fromisoformat(row[5]),
            file_path=row[3]
        )

    def list_notes(self, tag: Optional[str] = None) -> List[Note]:
        """List all notes, optionally filtered by tag."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        if tag:
            # Search for notes containing the tag
            cursor.execute('''
                SELECT id, title, tags, file_path, created_at, modified_at
                FROM notes
                ORDER BY modified_at DESC
            ''')
            rows = cursor.fetchall()
            # Filter by tag in Python since SQLite doesn't have native JSON array search
            filtered_rows = []
            for row in rows:
                tags = json.loads(row[2])
                if tag in tags:
                    filtered_rows.append(row)
            rows = filtered_rows
        else:
            cursor.execute('''
                SELECT id, title, tags, file_path, created_at, modified_at
                FROM notes
                ORDER BY modified_at DESC
            ''')
            rows = cursor.fetchall()

        conn.close()

        notes = []
        for row in rows:
            # Read content from file
            try:
                with open(row[3], 'r') as f:
                    content = f.read()
            except FileNotFoundError:
                content = "[Content file not found]"

            notes.append(Note(
                id=row[0],
                title=row[1],
                content=content,
                tags=json.loads(row[2]),
                created_at=datetime.fromisoformat(row[4]),
                modified_at=datetime.fromisoformat(row[5]),
                file_path=row[3]
            ))

        return notes

    def search_notes(self, query: str) -> List[Note]:
        """Search notes by content or title."""
        all_notes = self.list_notes()
        query_lower = query.lower()

        matching_notes = []
        for note in all_notes:
            if query_lower in note.title.lower() or query_lower in note.content.lower():
                matching_notes.append(note)

        return matching_notes

    def add_link(self, source_id: str, target_id: str, reason: str = "") -> NoteLink:
        """Create a link between two notes."""
        # Verify both notes exist
        if not self.get_note(source_id) or not self.get_note(target_id):
            raise ValueError("Both notes must exist to create a link")

        now = datetime.now()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO note_links (source_note_id, target_note_id, reason, created_at)
            VALUES (?, ?, ?, ?)
        ''', (source_id, target_id, reason, now.isoformat()))

        link_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return NoteLink(
            id=link_id,
            source_note_id=source_id,
            target_note_id=target_id,
            reason=reason,
            created_at=now
        )

    def get_note_links(self, note_id: str) -> List[NoteLink]:
        """Get all links for a note (both incoming and outgoing)."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, source_note_id, target_note_id, reason, created_at
            FROM note_links
            WHERE source_note_id = ? OR target_note_id = ?
        ''', (note_id, note_id))

        rows = cursor.fetchall()
        conn.close()

        links = []
        for row in rows:
            links.append(NoteLink(
                id=row[0],
                source_note_id=row[1],
                target_note_id=row[2],
                reason=row[3],
                created_at=datetime.fromisoformat(row[4])
            ))

        return links
