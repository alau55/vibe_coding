"""Personal Knowledge Base - A CLI tool for managing notes and knowledge."""

__version__ = '0.1.0'

from .models import Note, NoteLink
from .storage import KnowledgeBaseStorage
from .search import SearchEngine
from .cli import CLI, main

__all__ = [
    'Note',
    'NoteLink',
    'KnowledgeBaseStorage',
    'SearchEngine',
    'CLI',
    'main'
]
