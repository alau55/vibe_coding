-- Seed data for Knowledge Base testing
-- Note: Replace 'YOUR_USER_ID' with actual user UUID from auth.users

-- Insert sample Python notes
INSERT INTO public.kb_notes (user_id, title, content, tags, collection, metadata) VALUES
-- User ID will need to be set at runtime or updated manually
-- These are examples showing the data structure

-- Python Collection Notes
(
  (SELECT id FROM auth.users LIMIT 1),
  'Python List Comprehensions',
  E'List comprehensions provide a concise way to create lists in Python.\n\nBasic syntax:\n[expression for item in iterable if condition]\n\nExample:\nsquares = [x**2 for x in range(10)]\neven_squares = [x**2 for x in range(10) if x % 2 == 0]\n\nAdvantages:\n- More readable than traditional loops\n- Often faster than equivalent for loops\n- Can include conditional logic\n\nBest practices:\n- Keep them simple and readable\n- Avoid complex nested comprehensions\n- Use generator expressions for large datasets',
  ARRAY['python', 'comprehensions', 'syntax', 'best-practices'],
  'python',
  '{"source": "personal notes", "difficulty": "beginner", "last_reviewed": "2025-01-15"}'::JSONB
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Python Decorators Explained',
  E'Decorators are a powerful feature in Python that allows you to modify or extend the behavior of functions or classes.\n\nBasic decorator syntax:\n@decorator_name\ndef function_name():\n    pass\n\nCommon use cases:\n1. Logging function calls\n2. Timing function execution\n3. Authentication/authorization\n4. Caching/memoization\n\nExample - Simple timer decorator:\nimport time\nfrom functools import wraps\n\ndef timer(func):\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f"{func.__name__} took {time.time() - start:.2f}s")\n        return result\n    return wrapper\n\nKey concepts:\n- Decorators are functions that take functions as arguments\n- Use @wraps to preserve original function metadata\n- Can be stacked (multiple decorators on one function)\n- Can accept arguments using decorator factories',
  ARRAY['python', 'decorators', 'advanced', 'functions'],
  'python',
  '{"source": "python docs", "difficulty": "intermediate", "last_reviewed": "2025-01-10"}'::JSONB
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Python async/await Pattern',
  E'Asynchronous programming in Python using async/await syntax.\n\nBasic concepts:\n- async def: Defines a coroutine function\n- await: Suspends execution until awaitable completes\n- asyncio.run(): Entry point for async programs\n\nExample:\nimport asyncio\n\nasync def fetch_data(url):\n    # Simulate API call\n    await asyncio.sleep(1)\n    return f"Data from {url}"\n\nasync def main():\n    # Run concurrently\n    results = await asyncio.gather(\n        fetch_data("api1"),\n        fetch_data("api2"),\n        fetch_data("api3")\n    )\n    print(results)\n\nasyncio.run(main())\n\nWhen to use:\n- I/O-bound operations (network requests, file I/O)\n- Multiple concurrent tasks\n- Real-time applications\n\nWhen NOT to use:\n- CPU-bound operations (use multiprocessing instead)\n- Simple synchronous scripts',
  ARRAY['python', 'async', 'concurrency', 'advanced'],
  'python',
  '{"source": "async guide", "difficulty": "advanced", "last_reviewed": "2025-01-12"}'::JSONB
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Python Type Hints and mypy',
  E'Type hints improve code readability and enable static type checking.\n\nBasic syntax:\ndef greet(name: str) -> str:\n    return f"Hello, {name}"\n\nCommon types:\n- Basic: int, str, float, bool\n- Collections: List[int], Dict[str, int], Set[str], Tuple[int, ...]\n- Optional: Optional[str] (can be None)\n- Union: Union[int, str] (either type)\n- Any: Any (any type allowed)\n\nAdvanced features:\nfrom typing import List, Dict, Optional, TypedDict, Protocol\n\nclass Person(TypedDict):\n    name: str\n    age: int\n\ndef process_people(people: List[Person]) -> None:\n    pass\n\nUsing mypy for type checking:\n# Install: pip install mypy\n# Run: mypy your_script.py\n\nBenefits:\n- Catch bugs before runtime\n- Better IDE autocomplete\n- Self-documenting code\n- Easier refactoring\n\nNote: Type hints are optional and not enforced at runtime',
  ARRAY['python', 'typing', 'mypy', 'best-practices'],
  'python',
  '{"source": "typing docs", "difficulty": "intermediate", "last_reviewed": "2025-01-14"}'::JSONB
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Python Context Managers (with statement)',
  E'Context managers ensure proper resource management using the "with" statement.\n\nBasic usage:\nwith open("file.txt", "r") as f:\n    content = f.read()\n# File automatically closed\n\nCustom context manager (class-based):\nclass DatabaseConnection:\n    def __enter__(self):\n        self.conn = connect_to_db()\n        return self.conn\n    \n    def __exit__(self, exc_type, exc_val, exc_tb):\n        self.conn.close()\n        return False  # Don\'t suppress exceptions\n\nwith DatabaseConnection() as conn:\n    conn.execute("SELECT * FROM users")\n\nCustom context manager (function-based):\nfrom contextlib import contextmanager\n\n@contextmanager\ndef timer_context(name):\n    start = time.time()\n    yield\n    print(f"{name} took {time.time() - start:.2f}s")\n\nwith timer_context("my operation"):\n    # Your code here\n    pass\n\nCommon use cases:\n- File I/O\n- Database connections\n- Locks and synchronization\n- Temporary state changes',
  ARRAY['python', 'context-managers', 'best-practices', 'resources'],
  'python',
  '{"source": "personal notes", "difficulty": "intermediate", "last_reviewed": "2025-01-11"}'::JSONB
),

-- JavaScript Collection Notes
(
  (SELECT id FROM auth.users LIMIT 1),
  'JavaScript Promises and async/await',
  E'Modern asynchronous JavaScript patterns.\n\nPromise basics:\nconst promise = new Promise((resolve, reject) => {\n    if (success) resolve(data);\n    else reject(error);\n});\n\npromise\n    .then(data => console.log(data))\n    .catch(error => console.error(error));\n\nAsync/await (cleaner syntax):\nasync function fetchUser(id) {\n    try {\n        const response = await fetch(`/api/users/${id}`);\n        const user = await response.json();\n        return user;\n    } catch (error) {\n        console.error("Failed to fetch user:", error);\n    }\n}\n\nParallel execution:\nconst [users, posts] = await Promise.all([\n    fetchUsers(),\n    fetchPosts()\n]);\n\nKey differences from Python:\n- Promises are eager (execute immediately)\n- No asyncio.run() needed\n- try/catch for error handling',
  ARRAY['javascript', 'async', 'promises', 'modern-js'],
  'javascript',
  '{"source": "mdn", "difficulty": "intermediate", "related_to": "python async"}'::JSONB
),

-- Database Collection Notes
(
  (SELECT id FROM auth.users LIMIT 1),
  'PostgreSQL JSONB vs JSON',
  E'Understanding the difference between JSON and JSONB in PostgreSQL.\n\nJSON:\n- Stores exact text representation\n- Preserves formatting and whitespace\n- Faster to input\n- Slower to query\n\nJSONB (Binary JSON):\n- Stores decomposed binary format\n- Removes whitespace and duplicate keys\n- Slower to input (parsing overhead)\n- Much faster to query\n- Supports indexing\n- Supports operators like @>, ?, ?&, ?|\n\nRecommendation: Use JSONB unless you specifically need to preserve exact JSON formatting.\n\nExample JSONB queries:\n-- Contains operator\nSELECT * FROM notes WHERE metadata @> \'{"difficulty": "advanced"}\';\n\n-- Key exists\nSELECT * FROM notes WHERE metadata ? \'source\';\n\n-- GIN index for performance\nCREATE INDEX idx_metadata ON notes USING GIN (metadata);\n\nContradiction with earlier note: Some sources recommend JSON for write-heavy workloads, but benchmarks show JSONB is almost always better.',
  ARRAY['postgresql', 'jsonb', 'database', 'performance'],
  'database',
  '{"source": "postgres docs", "difficulty": "intermediate"}'::JSONB
),

-- React Collection Notes
(
  (SELECT id FROM auth.users LIMIT 1),
  'React Hooks Best Practices',
  E'Essential patterns and best practices for React Hooks.\n\nRules of Hooks:\n1. Only call hooks at the top level\n2. Only call hooks from React functions\n3. Use ESLint plugin for enforcement\n\nCommon hooks:\n- useState: Local component state\n- useEffect: Side effects (API calls, subscriptions)\n- useContext: Access context values\n- useMemo: Memoize expensive computations\n- useCallback: Memoize callback functions\n- useRef: Persist values across renders\n\nPerformance optimization:\nconst memoizedValue = useMemo(() => {\n    return expensiveCalculation(a, b);\n}, [a, b]);\n\nconst memoizedCallback = useCallback(() => {\n    doSomething(a, b);\n}, [a, b]);\n\nCommon mistake - Missing dependencies:\n// Bad\nuseEffect(() => {\n    fetchData(userId);\n}, []); // Missing userId dependency!\n\n// Good\nuseEffect(() => {\n    fetchData(userId);\n}, [userId]);\n\nGap: Need to research custom hooks patterns for better code reuse.',
  ARRAY['react', 'hooks', 'best-practices', 'performance'],
  'react',
  '{"source": "react docs", "difficulty": "intermediate", "framework": "react"}'::JSONB
);

-- Insert a sample summary (for testing)
INSERT INTO public.kb_summaries (user_id, summary_type, collection_name, summary_data, note_count) VALUES
(
  (SELECT id FROM auth.users LIMIT 1),
  'collection',
  'python',
  '{
    "overview": "Collection of Python programming notes covering beginner to advanced topics",
    "themes": [
      {
        "name": "Syntax and Language Features",
        "notes": ["List Comprehensions", "Decorators", "Context Managers", "Type Hints"],
        "key_points": [
          "Python offers concise syntax features like comprehensions and decorators",
          "Type hints improve code quality without runtime enforcement",
          "Context managers ensure proper resource management"
        ]
      },
      {
        "name": "Asynchronous Programming",
        "notes": ["async/await Pattern"],
        "key_points": [
          "Use async/await for I/O-bound operations",
          "asyncio.gather() for concurrent execution",
          "Not suitable for CPU-bound tasks"
        ]
      },
      {
        "name": "Best Practices and Code Quality",
        "notes": ["List Comprehensions", "Type Hints", "Context Managers"],
        "key_points": [
          "Write readable and maintainable code",
          "Use static type checking with mypy",
          "Leverage language features appropriately"
        ]
      }
    ],
    "contradictions": [],
    "gaps": [
      "No notes on testing (pytest, unittest)",
      "Missing coverage of virtual environments and dependency management",
      "No examples of Python packaging and distribution",
      "Error handling and exception patterns not covered"
    ],
    "difficulty_distribution": {
      "beginner": 1,
      "intermediate": 3,
      "advanced": 2
    },
    "summary": "This collection covers core Python language features from basic syntax to advanced patterns. Strong focus on modern Python idioms (comprehensions, decorators, type hints, async/await) and best practices. Notable gaps include testing, dependency management, and error handling patterns."
  }'::JSONB,
  5
);
