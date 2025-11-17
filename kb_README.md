# Personal Knowledge Base CLI

A lightweight, fast, and simple command-line tool for managing your personal knowledge base. Store notes, tag them, search through them, and create connections between related concepts.

## Features

- **Quick note capture** with markdown support
- **Tag-based organization** for easy categorization
- **Full-text search** with relevance ranking
- **Note linking** to connect related concepts
- **Local storage** - all your data stays on your machine
- **Zero configuration** - works out of the box

## Installation

### From Source

```bash
# Clone or navigate to the repository
cd /path/to/knowledge-base

# Install in development mode
pip install -e .

# Or install normally
pip install .
```

### Verify Installation

```bash
kb --help
```

## Quick Start

### Add a Note

```bash
# Add a simple note
kb add "Python list comprehensions provide a concise way to create lists" --tags python,learning

# Add a multi-line note (use quotes)
kb add "Machine Learning Basics

Supervised learning: learns from labeled data
Unsupervised learning: finds patterns in unlabeled data
Reinforcement learning: learns through trial and error" --tags ml,ai,learning
```

### Search Notes

```bash
# Search for notes containing specific keywords
kb search "machine learning"

# Search is case-insensitive and searches both title and content
kb search "python"
```

### List Notes

```bash
# List all notes
kb list

# List notes with a specific tag
kb list --tag python
kb list --tag learning
```

### View a Note

```bash
# View the full content of a note (use the ID from list/search results)
kb view abc123
```

### Link Notes

```bash
# Create a connection between related notes
kb link abc123 def456 --reason "both cover functional programming concepts"

# Links are bidirectional and shown when viewing notes
kb view abc123
```

## Usage Examples

### Capturing Learning Notes

```bash
# Python concept
kb add "List comprehensions: [x*2 for x in range(10)]" --tags python,snippets

# JavaScript concept
kb add "Arrow functions: const add = (a, b) => a + b" --tags javascript,snippets

# Link related concepts
kb link <python-id> <javascript-id> --reason "similar lambda/arrow function concepts"
```

### Building a Research Database

```bash
# Research paper notes
kb add "Paper: Attention Is All You Need
Main contribution: Transformer architecture
Key insight: Self-attention mechanism" --tags papers,nlp,transformers

# Implementation notes
kb add "Transformer implementation in PyTorch..." --tags pytorch,implementation

# Connect theory and practice
kb link <paper-id> <impl-id> --reason "implementation of paper"
```

### Project Documentation

```bash
# Architecture decision
kb add "Decided to use SQLite for storage because..." --tags architecture,decisions

# Bug investigation
kb add "Bug #123: Race condition in auth flow
Root cause: ..." --tags bugs,auth

# Solution
kb add "Fixed race condition by adding mutex..." --tags bugs,solutions,auth
```

## Data Storage

All data is stored locally in the `data/` directory:

```
data/
├── notes/          # Markdown files for note content
├── kb.db          # SQLite database for metadata
└── config.json    # User settings (future)
```

- **Notes are stored as markdown files** - easy to read, edit, and backup
- **Metadata in SQLite** - fast searching and querying
- **Plain text format** - your data is never locked in

## Architecture

```
kb/
├── cli.py         # Command-line interface
├── storage.py     # Database operations
├── search.py      # Search and ranking
└── models.py      # Data models
```

### Key Design Decisions

1. **SQLite for metadata**: Fast, reliable, zero-configuration
2. **Markdown files for content**: Human-readable, portable, editable
3. **No external dependencies**: Uses only Python standard library
4. **Simple data model**: Easy to understand and extend

## Advanced Usage

### Searching by Multiple Criteria

```bash
# Find all Python learning notes
kb list --tag python | grep -i learning

# Search within specific tag
kb list --tag ml
kb search "neural" # then manually filter
```

### Backup Your Knowledge Base

```bash
# Simple backup - just copy the data directory
cp -r data/ backup/knowledge-base-$(date +%Y%m%d)/

# Or use git
cd data/
git init
git add .
git commit -m "Knowledge base backup"
```

### Bulk Import

```python
# Python script to import multiple notes
from kb import KnowledgeBaseStorage

storage = KnowledgeBaseStorage()

notes = [
    ("Python basics", ["python", "basics"]),
    ("JavaScript tips", ["javascript", "tips"]),
]

for content, tags in notes:
    storage.add_note(content, tags)
```

## Roadmap

Future enhancements:

- [ ] Edit existing notes
- [ ] Delete notes
- [ ] Export to different formats (PDF, HTML)
- [ ] Full-text search with FTS5
- [ ] Graph visualization of note links
- [ ] Templates for different note types
- [ ] Sync between devices
- [ ] Web interface

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## License

MIT License - see LICENSE file for details

## Philosophy

This tool follows the Unix philosophy:

- **Do one thing well**: Manage personal knowledge
- **Plain text**: Store data in open, readable formats
- **Composable**: Works with other command-line tools
- **Local first**: Your data stays on your machine

The goal is to be a simple, fast, and reliable tool for developers and knowledge workers who live in the terminal.
