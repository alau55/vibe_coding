# Multi-Model Stock Valuation Tool

A comprehensive web application for valuing stocks using multiple professional valuation models. Input any stock ticker and choose from 6 different valuation methodologies to estimate fair value with confidence scores, sensitivity analysis, and peer comparisons.

## Features

- ✓ **6 Professional Valuation Models** - DCF, DDM, P/E Comparables, EV/EBITDA, P/B, and PEG Ratio
- ✓ **Smart Default Parameters** - Automatically calculated from historical financial data
- ✓ **Real-Time Data** - Fetches comprehensive stock data from Yahoo Finance
- ✓ **Sensitivity Analysis** - See how valuations change with different assumptions
- ✓ **Multi-Model Comparison** - Compare all applicable models side-by-side
- ✓ **Peer Analysis** - Benchmarks against industry comparables
- ✓ **Confidence Scoring** - Know how reliable each valuation is
- ✓ **Interactive Charts** - Visualize sensitivity and comparison data
- ✓ **Modern UI** - Clean, professional, mobile-responsive interface

## Supported Valuation Models

### 1. **DCF (Discounted Cash Flow)**
**Best for:** Companies with predictable cash flows (mature tech, consumer goods)

Projects future free cash flows and discounts them to present value using WACC. Adjusts for net debt to calculate equity value.

**Key Parameters:**
- Revenue growth rate
- Free cash flow margin
- WACC (discount rate)
- Terminal growth rate
- Projection period

### 2. **DDM (Dividend Discount Model)**
**Best for:** Dividend-paying stocks with consistent history (utilities, REITs)

Values a company based on the present value of future dividend payments using the Gordon Growth Model.

**Key Parameters:**
- Current dividend per share
- Dividend growth rate
- Required rate of return

### 3. **P/E Comparables**
**Best for:** Mature, profitable companies with stable earnings

Applies industry average P/E multiples to the company's earnings, adjusting for growth rate differences.

**Key Parameters:**
- Target company EPS
- Peer P/E ratios
- Growth adjustment factor

### 4. **EV/EBITDA Comparables**
**Best for:** Capital-intensive industries, highly leveraged companies

Calculates enterprise value using peer EV/EBITDA multiples, then subtracts net debt to get equity value.

**Key Parameters:**
- Target company EBITDA
- Peer EV/EBITDA ratios
- Adjustment factors

### 5. **Price-to-Book (P/B)**
**Best for:** Financial institutions, asset-heavy companies

Values company based on book value adjusted by industry P/B ratios and ROE differences.

**Key Parameters:**
- Book value per share
- Peer P/B ratios
- ROE adjustment

### 6. **PEG Ratio**
**Best for:** Growth stocks

Targets PEG ratio of 1.0 (fair value when P/E equals growth rate), adjusting for company quality.

**Key Parameters:**
- P/E ratio
- Earnings growth rate
- Target PEG ratio

## Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository:**
```bash
cd /home/user/vibe_coding/multi-model-stock-valuation
```

2. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
# Copy the example .env file
cp ../.env.example .env

# Edit .env if needed (optional)
```

### Running the Application

1. **Start the Backend API:**
```bash
cd backend
python app.py
```

The API will start on `http://localhost:5000`

2. **Open the Frontend:**

In a new terminal:
```bash
cd frontend
# Serve using Python's built-in HTTP server
python -m http.server 8000
```

Then open your browser to: `http://localhost:8000`

Or simply open `frontend/index.html` directly in your browser.

## Usage

### Step 1: Select a Stock

1. Enter a stock ticker symbol (e.g., `AAPL`, `MSFT`, `GOOGL`)
2. Click "Fetch Data" or press Enter
3. View comprehensive company information and key metrics

### Step 2: Choose a Valuation Model

1. Select a model from the dropdown
2. Models show applicability indicators:
   - ✓ Green = Highly Recommended
   - ⚠ Yellow = Applicable with cautions
   - ✗ Red = Not Suitable (with reason)
3. Hover over model names to see descriptions

### Step 3: Configure Parameters

1. Review automatically calculated default values
2. Adjust parameters as needed
3. Use tooltips (?) to understand each parameter
4. Click "Use Default" to reset any value

### Step 4: View Results

The tool will display:
- **Fair Value** - Calculated per-share value
- **Current Price** - Market price for comparison
- **Verdict** - Undervalued/Fairly Valued/Overvalued
- **Confidence Score** - Reliability based on data quality
- **Key Assumptions** - All parameters used
- **Sensitivity Analysis** - Charts showing how valuation changes with different assumptions

### Step 5: Compare All Models (Optional)

Click "Compare All Models" to:
- Run all applicable models simultaneously
- See consensus fair value (average)
- View range of estimates (min to max)
- Get overall recommendation
- Compare results in a side-by-side table

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Search Ticker
```http
POST /api/ticker/search
Content-Type: application/json

{
  "query": "AAPL"
}
```

**Response:**
```json
{
  "results": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc."
    }
  ],
  "count": 1
}
```

#### 2. Fetch Stock Data
```http
POST /api/stock/fetch
Content-Type: application/json

{
  "ticker": "AAPL"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "current_price": 182.50,
    "company_info": {...},
    "income_statement": {...},
    "balance_sheet": {...},
    "cash_flow": {...},
    "key_metrics": {...},
    "data_quality_score": 95
  }
}
```

#### 3. List Models
```http
GET /api/models/list
```

**Response:**
```json
{
  "models": [
    {
      "id": "DCF",
      "name": "DCF (Discounted Cash Flow)",
      "description": "...",
      "best_for": "Companies with predictable cash flows",
      "category": "Intrinsic"
    },
    ...
  ],
  "count": 6
}
```

#### 4. Check Model Applicability
```http
POST /api/models/check-applicability
Content-Type: application/json

{
  "ticker": "AAPL",
  "model": "DCF"
}
```

**Response:**
```json
{
  "applicable": true,
  "reason": "Company has predictable cash flows suitable for DCF",
  "confidence": 85,
  "model_info": {...}
}
```

#### 5. Get Model Inputs
```http
POST /api/models/get-inputs
Content-Type: application/json

{
  "ticker": "AAPL",
  "model": "DCF"
}
```

**Response:**
```json
{
  "inputs": {
    "revenue_growth": {
      "label": "Revenue Growth Rate",
      "value": 15.0,
      "unit": "%",
      "min": -50,
      "max": 100,
      "step": 0.5,
      "tooltip": "Expected annual revenue growth rate"
    },
    ...
  }
}
```

#### 6. Calculate Valuation
```http
POST /api/valuation/calculate
Content-Type: application/json

{
  "ticker": "AAPL",
  "model": "DCF",
  "inputs": {
    "revenue_growth": 15.0,
    "fcf_margin": 20.0,
    "wacc": 10.0,
    "terminal_growth": 2.5,
    "projection_years": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "fair_value": 175.50,
    "current_price": 182.00,
    "difference_pct": -3.6,
    "verdict": "Fairly Valued",
    "confidence": 85,
    "assumptions": {...},
    "sensitivity": {...}
  }
}
```

#### 7. Compare All Models
```http
POST /api/valuation/compare-all
Content-Type: application/json

{
  "ticker": "AAPL"
}
```

**Response:**
```json
{
  "success": true,
  "ticker": "AAPL",
  "results": [
    {
      "model_id": "DCF",
      "model_info": {...},
      "applicable": true,
      "result": {...}
    },
    ...
  ],
  "consensus": {
    "fair_value_avg": 178.25,
    "fair_value_min": 165.00,
    "fair_value_max": 190.00,
    "current_price": 182.00,
    "verdict": "Fairly Valued",
    "models_used": 4
  }
}
```

## Project Structure

```
multi-model-stock-valuation/
├── backend/
│   ├── app.py                    # Flask API
│   ├── config.py                 # Configuration
│   ├── requirements.txt          # Python dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base_model.py        # Abstract base class
│   │   ├── dcf_model.py         # DCF valuation
│   │   ├── ddm_model.py         # Dividend Discount Model
│   │   ├── pe_model.py          # P/E Comparables
│   │   ├── ev_ebitda_model.py   # EV/EBITDA Comparables
│   │   ├── pb_model.py          # Price-to-Book
│   │   └── peg_model.py         # PEG Ratio
│   ├── data/
│   │   ├── __init__.py
│   │   ├── data_fetcher.py      # Yahoo Finance integration
│   │   ├── peer_finder.py       # Find comparable companies
│   │   └── financial_metrics.py # Calculate metrics
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validators.py        # Input validation
│   │   └── formatters.py        # Data formatting
│   └── tests/
│       ├── test_models.py
│       └── test_data_fetcher.py
├── frontend/
│   ├── index.html               # Main HTML
│   ├── css/
│   │   └── styles.css          # All styles
│   ├── js/
│   │   ├── app.js              # Main application
│   │   ├── ticker-input.js     # Ticker search component
│   │   ├── model-selector.js   # Model selection
│   │   ├── valuation-form.js   # Dynamic form
│   │   └── results-display.js  # Results visualization
│   └── assets/
├── .gitignore
├── .env.example
└── README.md
```

## Technology Stack

**Backend:**
- Flask 3.0 - Web framework
- yfinance 0.2.36 - Yahoo Finance API
- pandas 2.1.3 - Data manipulation
- numpy 1.26.2 - Numerical computing
- scipy 1.11.4 - Scientific computing

**Frontend:**
- Vanilla JavaScript (ES6+)
- Chart.js - Data visualization
- HTML5 & CSS3
- Fetch API for HTTP requests

## Disclaimer

⚠️ **Important:** This tool is for **educational purposes only**. The valuations provided are based on publicly available financial data and simplified models. They should **NOT** be used as the sole basis for investment decisions.

**Always:**
- Do your own research
- Consult with financial professionals
- Consider multiple factors beyond valuation
- Understand the limitations of each model
- Be aware that past performance does not guarantee future results

## Model Limitations

### DCF
- Assumes constant growth rates
- Highly sensitive to WACC and terminal growth assumptions
- Requires predictable cash flows
- May not work well for early-stage or cyclical companies

### DDM
- Only applicable to dividend-paying stocks
- Assumes dividends will continue indefinitely
- Not suitable for companies that reinvest all earnings
- Sensitive to growth rate assumptions

### Comparables Models (P/E, EV/EBITDA, P/B)
- Assumes peer companies are truly comparable
- Subject to market sentiment affecting entire sector
- May not capture company-specific factors
- Requires sufficient peer data

### PEG
- Only works for profitable, growing companies
- Assumes linear relationship between P/E and growth
- Doesn't account for risk differences
- Growth estimates can be unreliable

## Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'flask'`
**Solution:** Install dependencies: `pip install -r requirements.txt`

**Problem:** `Address already in use`
**Solution:** Change port in `app.py` or kill process using port 5000

**Problem:** `Error fetching data for TICKER`
**Solution:** Check internet connection, verify ticker symbol is valid

### Frontend Issues

**Problem:** CORS errors in browser console
**Solution:** Ensure Flask-CORS is installed and backend is running

**Problem:** Charts not displaying
**Solution:** Check that Chart.js CDN is loading (check browser console)

**Problem:** "Unable to connect to API"
**Solution:** Verify backend is running on http://localhost:5000

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Adding a New Valuation Model

1. Create new model file in `backend/models/`
2. Inherit from `BaseValuationModel`
3. Implement all abstract methods:
   - `_get_model_name()`
   - `_get_model_description()`
   - `get_required_inputs()`
   - `calculate()`
   - `is_applicable()` (optional override)
4. Add model to `MODELS` dict in `app.py`
5. Add model metadata to `MODEL_INFO` in `app.py`
6. Update frontend model selector if needed

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Data provided by Yahoo Finance via the yfinance library
- Built with Flask and vanilla JavaScript
- Inspired by traditional investment banking valuation methods
- Chart visualizations powered by Chart.js

## Contact

For questions, issues, or suggestions, please open an issue on GitHub.

---

**Happy Valuing! 📊📈**
