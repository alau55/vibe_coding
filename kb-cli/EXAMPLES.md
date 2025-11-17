# KB CLI Examples

## Quick Start

### 1. Install and Configure

```bash
cd kb-cli
npm install
npm link

# Set your API key
kb config --api-key sk-ant-your-key-here
```

### 2. Add Your First Entry with Auto-Tagging

```bash
kb add "Python decorators are functions that modify the behavior of other functions. They use the @ syntax and are widely used in web frameworks like Flask and Django for routing and authentication." --auto-tags
```

**What happens:**
- AI analyzes the content
- Suggests: `python`, `decorators`, `web-frameworks`, `flask`, `django`
- You select which tags to keep
- Entry is saved with your chosen tags

### 3. Add Multiple Entries

```bash
# Machine Learning
kb add "Gradient descent is an optimization algorithm used to minimize the cost function in machine learning models by iteratively moving in the direction of steepest descent." --auto-tags

# Web Development
kb add "React hooks revolutionized functional components by allowing state and lifecycle methods. useState manages state, useEffect handles side effects." --auto-tags

# DevOps
kb add "Docker containers package applications with their dependencies, ensuring consistency across development and production environments." --auto-tags

# Database
kb add "Database normalization organizes data to reduce redundancy. The third normal form (3NF) ensures that non-key attributes depend only on the primary key." --auto-tags
```

### 4. Explore Your Knowledge Base

```bash
# View all entries
kb list

# Search for specific content
kb search "python"
kb search "optimization"

# Filter by tag
kb list --tag machine-learning

# View all tags and their usage
kb tags
```

### 5. Manual Tag Management

```bash
# Add entry with manual tags
kb add "REST APIs use HTTP methods: GET for retrieval, POST for creation, PUT for updates, DELETE for removal." --tags "api,rest,http,web"

# Add entry without tags
kb add "Quick note: Remember to review pull requests by Friday"
```

## Advanced Usage

### Building a Learning Journal

```bash
# Day 1: Learning React
kb add "Today I learned about React Context API. It provides a way to pass data through the component tree without prop drilling. Uses createContext and useContext hooks." --auto-tags

# Day 2: TypeScript Generics
kb add "TypeScript generics enable writing reusable code that works with multiple types. Function<T> syntax allows type parameters, similar to Java or C# generics." --auto-tags

# Day 3: Docker Networking
kb add "Docker networking modes: bridge (default), host (uses host network), none (no networking), overlay (multi-host). Bridge mode creates virtual network for containers." --auto-tags

# Review your learning
kb list --limit 3
kb tags
```

### Organizing Technical Concepts

```bash
# Add various programming concepts
kb add "Closures in JavaScript capture variables from outer scope. Inner functions maintain access to outer variables even after outer function returns." --auto-tags

kb add "Mutex (mutual exclusion) locks prevent race conditions in concurrent programming. Only one thread can hold the lock at a time." --auto-tags

kb add "Binary search tree operations: insert O(log n), search O(log n), delete O(log n) on average. Worst case O(n) for unbalanced trees." --auto-tags

# Search by topic
kb search "concurrent"
kb search "O(log n)"

# View by category
kb list --tag javascript
kb list --tag algorithms
```

### Knowledge Base Statistics

```bash
# View stats
kb stats

# Check configuration
kb config --show
```

## Tips for Better Auto-Tagging

### 1. Provide Context

**Good:**
```bash
kb add "GraphQL allows clients to request exactly the data they need. Unlike REST which returns fixed data structures, GraphQL queries specify required fields, reducing over-fetching and under-fetching." --auto-tags
```
*AI will suggest:* `graphql`, `api`, `rest-comparison`, `query-language`

**Less Detailed:**
```bash
kb add "GraphQL is good" --auto-tags
```
*AI might only suggest:* `graphql`

### 2. Include Technical Details

```bash
kb add "Kubernetes pods are the smallest deployable units. Each pod can contain one or more containers sharing network and storage. Pods are ephemeral and managed by controllers like Deployments and StatefulSets." --auto-tags
```
*Suggests:* `kubernetes`, `pods`, `containers`, `orchestration`, `deployment`

### 3. Explain Relationships

```bash
kb add "Redux vs Context API: Redux provides time-travel debugging, middleware support, and better DevTools. Context API is simpler for small apps but can cause performance issues with frequent updates due to re-renders." --auto-tags
```
*Suggests:* `redux`, `context-api`, `react`, `state-management`, `performance`

## Common Workflows

### Research Session

```bash
# Store findings as you research
kb add "Found that PostgreSQL JSONB type supports indexing, unlike JSON type. JSONB is stored in binary format, faster for processing but slower for input." --auto-tags

kb add "AWS Lambda cold starts: typically 100-300ms for Node.js, 400-600ms for Python. Can be mitigated with provisioned concurrency." --auto-tags

# Review your research
kb list --limit 10
```

### Code Snippet Library

```bash
kb add "Python list comprehension with condition: [x*2 for x in range(10) if x % 2 == 0] creates list of even numbers doubled." --auto-tags

kb add "JavaScript array methods chaining: arr.filter(x => x > 0).map(x => x * 2).reduce((a,b) => a + b, 0) - filter, transform, aggregate." --auto-tags
```

### Interview Prep

```bash
kb add "System design: Load balancer distributes traffic across servers. Types: L4 (transport layer, based on IP/port) and L7 (application layer, based on content). Examples: NGINX, HAProxy." --auto-tags

kb add "Big O notation: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic, O(2ⁿ) exponential. Focus on worst-case complexity." --auto-tags

# Review before interview
kb search "system design"
kb list --tag algorithms
```

## Backup Your Data

Your data is stored in `~/.kb-cli/`:

```bash
# Backup
tar -czf kb-backup-$(date +%Y%m%d).tar.gz ~/.kb-cli/

# Restore
tar -xzf kb-backup-20231115.tar.gz -C ~/
```
