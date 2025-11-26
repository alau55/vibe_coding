# Contributing to Multi-Model Stock Valuation Tool

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Stock ticker that caused the issue (if applicable)
- Your environment (OS, Python version)

### Suggesting Features

We welcome feature suggestions! Please create an issue with:
- Clear description of the feature
- Use case and benefits
- Any implementation ideas you have

### Adding New Valuation Models

Want to add a new valuation model? Great! Here's how:

#### 1. Create the Model File

Create a new file in `backend/models/` (e.g., `residual_income_model.py`):

```python
from typing import Dict, Any, Tuple
from .base_model import BaseValuationModel

class ResidualIncomeModel(BaseValuationModel):
    def _get_model_name(self) -> str:
        return "Residual Income Model"

    def _get_model_description(self) -> str:
        return "Values company based on book value plus PV of excess returns"

    def is_applicable(self) -> Tuple[bool, str]:
        # Check if model is suitable
        # Return (True, reason) or (False, reason)
        pass

    def get_required_inputs(self) -> Dict[str, Dict[str, Any]]:
        # Return input fields with smart defaults
        pass

    def calculate(self, user_inputs: Dict[str, float]) -> Dict[str, Any]:
        # Perform valuation calculation
        # Return standardized result dictionary
        pass
```

#### 2. Register the Model

Add to `backend/models/__init__.py`:
```python
from .residual_income_model import ResidualIncomeModel

__all__ = [..., 'ResidualIncomeModel']
```

Add to `backend/app.py`:
```python
MODELS = {
    ...,
    'RESIDUAL_INCOME': ResidualIncomeModel
}

MODEL_INFO = {
    ...,
    'RESIDUAL_INCOME': {
        'id': 'RESIDUAL_INCOME',
        'name': 'Residual Income Model',
        'description': '...',
        'best_for': 'Companies with stable book values',
        'category': 'Intrinsic'
    }
}
```

#### 3. Write Tests

Create tests in `backend/tests/test_models.py`:
```python
def test_residual_income_model():
    # Test model with mock data
    pass
```

#### 4. Update Documentation

- Add model description to README.md
- Document required inputs and outputs
- Explain when the model is most appropriate

### Code Style Guidelines

**Python:**
- Follow PEP 8
- Use type hints
- Write docstrings for all functions
- Keep functions focused and small
- Use descriptive variable names

**JavaScript:**
- Use ES6+ syntax
- Use const/let (not var)
- Write clear comments
- Use camelCase for variables
- Use async/await for promises

**General:**
- Write self-documenting code
- Add comments for complex logic
- Keep lines under 100 characters
- Use meaningful commit messages

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: Add Residual Income valuation model

Implements residual income model using book value and excess returns.
Includes smart defaults from financial data and sensitivity analysis.

Closes #42
```

```
fix: Handle missing dividend data in DDM model

DDM model now gracefully handles stocks with no dividend history
instead of throwing an error.
```

### Pull Request Process

1. **Fork the repository** and create a branch from `main`
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes** following the code style guidelines

3. **Test your changes**
   ```bash
   python -m pytest backend/tests/
   ```

4. **Update documentation** as needed

5. **Commit your changes** with clear commit messages

6. **Push to your fork**
   ```bash
   git push origin feature/my-new-feature
   ```

7. **Create a Pull Request** with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots (if UI changes)
   - Test results

8. **Respond to feedback** from reviewers

### Testing Requirements

All contributions should include tests:

**Backend:**
- Unit tests for new models
- Integration tests for API endpoints
- Test edge cases and error handling

**Frontend:**
- Test user interactions
- Test API integration
- Test error scenarios

Run tests before submitting:
```bash
# Backend tests
cd backend
python -m pytest tests/

# Check syntax
python -m py_compile **/*.py
```

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alau55/vibe_coding.git
   cd vibe_coding/multi-model-stock-valuation
   ```

2. **Set up Python environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Run the backend:**
   ```bash
   python app.py
   ```

4. **Open the frontend:**
   ```bash
   cd ../frontend
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

### Project Structure

```
backend/
├── app.py              # Flask API with all endpoints
├── config.py           # Configuration settings
├── models/             # Valuation models
│   ├── base_model.py  # Abstract base class
│   └── *_model.py     # Individual models
├── data/               # Data fetching and processing
│   ├── data_fetcher.py
│   └── peer_finder.py
└── tests/              # Unit and integration tests

frontend/
├── index.html          # Main HTML page
├── css/
│   └── styles.css     # All styling
└── js/                 # JavaScript components
    ├── app.js          # Main controller
    ├── ticker-input.js
    ├── model-selector.js
    ├── valuation-form.js
    └── results-display.js
```

### Financial Model Guidelines

When implementing valuation models:

1. **Accuracy:** Use academically recognized formulas
2. **Smart Defaults:** Calculate reasonable defaults from historical data
3. **Validation:** Check applicability before running calculations
4. **Error Handling:** Provide clear error messages
5. **Documentation:** Explain assumptions and limitations
6. **Sensitivity:** Include sensitivity analysis where applicable

### Code Review Checklist

Before submitting, verify:

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No sensitive data (API keys, passwords)
- [ ] Commit messages are clear
- [ ] No debugging code (console.log, print statements)
- [ ] Error handling is proper
- [ ] Edge cases are handled

## Questions?

If you have questions:
- Check existing issues and discussions
- Create a new discussion for questions
- Tag maintainers in issues if urgent

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉
