# KB CLI - AI-Powered Knowledge Base

A command-line knowledge base tool with AI-powered auto-tagging using Claude API.

## Features

- 📝 Store and organize knowledge entries
- 🤖 AI-powered automatic tag suggestions using Claude
- 🏷️ Tag management with usage statistics
- 🔍 Full-text search across entries and tags
- 💾 Local JSON file storage (no database required)
- 🎨 Beautiful CLI interface with colors and formatting

## Installation

```bash
cd kb-cli
npm install
npm link
```

This will make the `kb` command available globally on your system.

## Configuration

Before using auto-tagging features, set up your Anthropic API key:

```bash
# Option 1: Save to config file
kb config --api-key sk-ant-...

# Option 2: Use environment variable
export ANTHROPIC_API_KEY=sk-ant-...
```

View your configuration:

```bash
kb config --show
```

## Usage

### Add Entry with Auto-Tagging

The main feature! Use AI to analyze your content and suggest relevant tags:

```bash
kb add "Python decorators are a powerful feature that allows you to modify the behavior of functions or classes. They use the @decorator syntax and are commonly used for logging, timing, and access control." --auto-tags
```

**What happens:**
1. AI analyzes the content
2. Suggests relevant tags (e.g., "python", "decorators", "programming")
3. Shows reasoning for suggestions
4. Lets you select which tags to apply
5. Option to add custom tags

### Add Entry with Manual Tags

```bash
kb add "Content here" --tags "python,programming,tutorial"
```

### Add Entry without Tags

```bash
kb add "Just some content"
```

### List Entries

```bash
# List all entries (default: 20 most recent)
kb list

# List with custom limit
kb list --limit 50

# Filter by tag
kb list --tag python
```

### Search Entries

```bash
kb search "decorators"
kb search "python functions"
```

### Manage Tags

```bash
# View all tags with usage statistics
kb tags
```

### View Statistics

```bash
kb stats
```

## Examples

### Example 1: Adding Python Content

```bash
kb add "List comprehensions in Python provide a concise way to create lists. They consist of brackets containing an expression followed by a for clause, then zero or more for or if clauses." --auto-tags
```

**AI might suggest:** `python`, `list-comprehension`, `programming`, `syntax`

### Example 2: Adding Machine Learning Content

```bash
kb add "Neural networks are computing systems inspired by biological neural networks. They consist of layers of interconnected nodes that process and transform input data to produce outputs." --auto-tags
```

**AI might suggest:** `machine-learning`, `neural-networks`, `ai`, `deep-learning`

### Example 3: Searching and Organizing

```bash
# Add multiple entries
kb add "React hooks like useState and useEffect..." --auto-tags
kb add "Docker containers provide isolated environments..." --auto-tags
kb add "RESTful APIs follow specific architectural constraints..." --auto-tags

# List all entries
kb list

# Search for specific topics
kb search "React"

# View entries by tag
kb list --tag javascript

# See all your tags
kb tags
```

## Data Storage

All data is stored locally in `~/.kb-cli/`:

- `entries.json` - Your knowledge base entries
- `tags.json` - Tag statistics and metadata
- `config.json` - Configuration (including API key)

## Auto-Tagging Details

The auto-tagging feature:

1. **Analyzes content** using Claude AI to understand key concepts
2. **Suggests tags** based on:
   - Main topics and themes
   - Technical terms and concepts
   - Existing tags in your knowledge base (prefers reuse)
3. **Interactive selection** lets you:
   - Review AI reasoning
   - Select/deselect suggested tags
   - Add custom tags
4. **Smart formatting** uses lowercase and hyphens (e.g., `machine-learning`)

## Commands Reference

| Command | Description | Options |
|---------|-------------|---------|
| `kb add <content>` | Add new entry | `--auto-tags`, `--tags <tags>` |
| `kb list` | List entries | `--tag <tag>`, `--limit <n>` |
| `kb search <query>` | Search entries | - |
| `kb tags` | Show all tags | - |
| `kb config` | Configuration | `--api-key <key>`, `--show` |
| `kb stats` | Show statistics | - |

## Tips

1. **Use auto-tags liberally** - The AI is good at identifying relevant topics
2. **Build a taxonomy** - The AI will reuse existing tags when appropriate
3. **Be specific** - More detailed content leads to better tag suggestions
4. **Review suggestions** - You can always customize the AI's suggestions
5. **Search is powerful** - Searches both content and tags

## Uninstallation

```bash
npm unlink -g kb-cli
```

## Requirements

- Node.js 18+ (for ES modules support)
- Anthropic API key (for auto-tagging feature)

## License

MIT
