"""Command-line interface for the knowledge base."""

import argparse
import sys
from datetime import datetime
from typing import Optional

from .storage import KnowledgeBaseStorage
from .search import SearchEngine


class CLI:
    """Command-line interface handler."""

    def __init__(self):
        """Initialize CLI with storage."""
        self.storage = KnowledgeBaseStorage()
        self.search_engine = SearchEngine()

    def add(self, content: str, tags: Optional[str] = None):
        """Add a new note."""
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]

        note = self.storage.add_note(content, tag_list)
        print(f"✓ Note created: {note.id}")
        print(f"  Title: {note.title}")
        print(f"  Tags: {', '.join(note.tags) if note.tags else 'None'}")
        print(f"  File: {note.file_path}")

    def search(self, query: str):
        """Search for notes."""
        notes = self.storage.search_notes(query)

        if not notes:
            print(f"No notes found matching '{query}'")
            return

        # Rank results
        ranked = self.search_engine.rank_results(notes, query)

        print(f"Found {len(ranked)} note(s) matching '{query}':\n")

        for note, score in ranked:
            print(f"ID: {note.id}")
            print(f"Title: {note.title}")
            print(f"Tags: {', '.join(note.tags) if note.tags else 'None'}")
            print(f"Modified: {note.modified_at.strftime('%Y-%m-%d %H:%M:%S')}")

            # Show a snippet
            snippet = self.search_engine.highlight_match(note.content, query, 150)
            print(f"Preview: {snippet}")
            print("-" * 70)

    def list(self, tag: Optional[str] = None):
        """List all notes or notes with a specific tag."""
        notes = self.storage.list_notes(tag=tag)

        if not notes:
            if tag:
                print(f"No notes found with tag '{tag}'")
            else:
                print("No notes in the knowledge base yet")
            return

        header = f"All notes ({len(notes)})" if not tag else f"Notes tagged '{tag}' ({len(notes)})"
        print(f"{header}:\n")

        for note in notes:
            print(f"ID: {note.id}")
            print(f"Title: {note.title}")
            print(f"Tags: {', '.join(note.tags) if note.tags else 'None'}")
            print(f"Created: {note.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Modified: {note.modified_at.strftime('%Y-%m-%d %H:%M:%S')}")
            print("-" * 70)

    def view(self, note_id: str):
        """View a specific note."""
        note = self.storage.get_note(note_id)

        if not note:
            print(f"Note '{note_id}' not found")
            return

        print(f"ID: {note.id}")
        print(f"Title: {note.title}")
        print(f"Tags: {', '.join(note.tags) if note.tags else 'None'}")
        print(f"Created: {note.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Modified: {note.modified_at.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        print(note.content)
        print("=" * 70)

        # Show links
        links = self.storage.get_note_links(note_id)
        if links:
            print(f"\nLinked notes ({len(links)}):")
            for link in links:
                if link.source_note_id == note_id:
                    other_id = link.target_note_id
                    direction = "→"
                else:
                    other_id = link.source_note_id
                    direction = "←"

                other_note = self.storage.get_note(other_id)
                if other_note:
                    reason_str = f" ({link.reason})" if link.reason else ""
                    print(f"  {direction} {other_id}: {other_note.title}{reason_str}")

    def link(self, source_id: str, target_id: str, reason: Optional[str] = None):
        """Create a link between two notes."""
        try:
            link = self.storage.add_link(source_id, target_id, reason or "")

            source = self.storage.get_note(source_id)
            target = self.storage.get_note(target_id)

            print(f"✓ Link created between notes:")
            print(f"  {source_id}: {source.title}")
            print(f"  → {target_id}: {target.title}")
            if reason:
                print(f"  Reason: {reason}")
        except ValueError as e:
            print(f"Error: {e}")


def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description='Personal Knowledge Base CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  kb add "Your note content" --tags python,learning
  kb search "machine learning"
  kb list --tag python
  kb view abc123
  kb link abc123 def456 --reason "related concepts"
        '''
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Add command
    add_parser = subparsers.add_parser('add', help='Add a new note')
    add_parser.add_argument('content', help='Note content')
    add_parser.add_argument('--tags', '-t', help='Comma-separated tags')

    # Search command
    search_parser = subparsers.add_parser('search', help='Search notes')
    search_parser.add_argument('query', help='Search query')

    # List command
    list_parser = subparsers.add_parser('list', help='List all notes')
    list_parser.add_argument('--tag', '-t', help='Filter by tag')

    # View command
    view_parser = subparsers.add_parser('view', help='View a specific note')
    view_parser.add_argument('note_id', help='Note ID')

    # Link command
    link_parser = subparsers.add_parser('link', help='Link two notes')
    link_parser.add_argument('source_id', help='Source note ID')
    link_parser.add_argument('target_id', help='Target note ID')
    link_parser.add_argument('--reason', '-r', help='Reason for the link')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    cli = CLI()

    try:
        if args.command == 'add':
            cli.add(args.content, args.tags)
        elif args.command == 'search':
            cli.search(args.query)
        elif args.command == 'list':
            cli.list(args.tag)
        elif args.command == 'view':
            cli.view(args.note_id)
        elif args.command == 'link':
            cli.link(args.source_id, args.target_id, args.reason)
    except KeyboardInterrupt:
        print("\nOperation cancelled")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
