# Stock Valuation DCF Tool

A comprehensive web-based application for performing Discounted Cash Flow (DCF) valuation analysis on publicly traded stocks.

## Features

- **Real-time Stock Data**: Fetches live financial data from Yahoo Finance
- **DCF Calculation**: Performs complete DCF valuation with customizable parameters
- **Historical Analysis**: Analyzes historical revenue, FCF, and EBITDA trends
- **Sensitivity Analysis**: Shows valuation sensitivity to different growth and discount rates
- **Interactive Charts**: Visualizes projected cash flows and value breakdown
- **Smart Suggestions**: Recommends DCF parameters based on historical performance
- **Save & Export**: Save analyses locally and export reports

## Tech Stack

### Backend
- **Python 3.8+**
- **Flask**: Web framework for REST API
- **yfinance**: Yahoo Finance data fetcher
- **pandas**: Data manipulation
- **numpy**: Numerical calculations

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **Vanilla JavaScript**: No framework dependencies
- **Chart.js**: Interactive charts and visualizations

## Project Structure

```
stock-valuation-dcf/
├── backend/
│   ├── app.py                  # Flask API server
│   ├── data_fetcher.py         # Yahoo Finance data fetching
│   ├── dcf_calculator.py       # DCF valuation logic
│   ├── financial_metrics.py    # Financial calculations
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── index.html              # Main HTML page
│   ├── app.js                  # JavaScript application
│   └── styles.css              # CSS styles
└── README.md
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd stock-valuation-dcf/backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the Flask server:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd stock-valuation-dcf/frontend
```

2. Open `index.html` in a web browser, or serve it using a simple HTTP server:
```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Usage

### 1. Search for a Stock

Enter a stock ticker symbol (e.g., AAPL, MSFT, GOOGL) in the search box and click "Analyze".

### 2. Review Company Information

The app will display:
- Company name and current stock price
- Market capitalization and sector
- Historical financial metrics (Revenue CAGR, FCF CAGR, FCF margins)

### 3. Adjust DCF Parameters

The calculator pre-fills suggested parameters based on historical data:
- **Growth Rate**: Expected annual FCF growth rate
- **Discount Rate (WACC)**: Weighted Average Cost of Capital
- **Terminal Growth Rate**: Perpetual growth rate for terminal value
- **Projection Years**: Number of years to project (typically 5-10)

### 4. Calculate Valuation

Click "Calculate Valuation" to run the DCF analysis. Results include:
- Fair value per share
- Comparison with current price (upside/downside)
- Valuation breakdown (PV of cash flows + terminal value)
- Projected cash flow charts
- Sensitivity analysis table

### 5. Save or Export

- **Save Analysis**: Stores the analysis in browser localStorage
- **Export to PDF**: Downloads a text report of the valuation

## API Documentation

### Endpoints

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Stock Valuation DCF API is running"
}
```

#### GET /api/stock/:ticker
Get stock data and financial metrics.

**Parameters:**
- `ticker`: Stock ticker symbol (e.g., AAPL)

**Response:**
```json
{
  "success": true,
  "data": {
    "company_info": { ... },
    "key_metrics": { ... },
    "historical_analysis": { ... },
    "suggested_dcf_inputs": { ... }
  }
}
```

#### POST /api/valuation
Calculate DCF valuation.

**Request Body:**
```json
{
  "ticker": "AAPL",
  "growth_rate": 0.05,
  "discount_rate": 0.10,
  "terminal_growth_rate": 0.025,
  "projection_years": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "current_price": 150.00,
    "fair_value": 175.50,
    "upside_downside_percent": 17.00,
    "valuation": { ... },
    "sensitivity": { ... }
  }
}
```

## How DCF Works

The Discounted Cash Flow (DCF) valuation method estimates a company's intrinsic value by:

1. **Projecting Future Cash Flows**: Forecasting free cash flows for a projection period (typically 5-10 years)

2. **Calculating Terminal Value**: Estimating the company's value beyond the projection period using the perpetuity growth method:
   ```
   Terminal Value = Final Year FCF × (1 + Terminal Growth) / (Discount Rate - Terminal Growth)
   ```

3. **Discounting to Present Value**: Discounting all future cash flows and terminal value to present value using the discount rate (WACC):
   ```
   PV = FCF / (1 + WACC)^year
   ```

4. **Calculating Enterprise Value**: Sum of all discounted cash flows

5. **Calculating Equity Value**: Enterprise Value - Debt + Cash

6. **Fair Value Per Share**: Equity Value / Shares Outstanding

## Understanding the Inputs

### Growth Rate
- Historical revenue and FCF growth rates provide guidance
- Consider industry trends and company maturity
- Conservative estimates are generally more reliable

### Discount Rate (WACC)
- Calculated using CAPM: `Cost of Equity = Risk-Free Rate + Beta × Market Risk Premium`
- The app calculates WACC automatically based on the company's capital structure
- Higher discount rates result in lower valuations

### Terminal Growth Rate
- Should not exceed long-term GDP growth (typically 2-3%)
- Represents the perpetual growth rate of the company
- Conservative estimates prevent overvaluation

## Limitations

- **Garbage In, Garbage Out**: DCF is highly sensitive to input assumptions
- **Not Suitable for All Companies**: Works best for mature companies with predictable cash flows
- **Historical Data**: Past performance doesn't guarantee future results
- **Market Efficiency**: Market prices may reflect information not captured in the model

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this project for educational or commercial purposes.

## Disclaimer

This tool is for educational and informational purposes only. It does not constitute financial advice. Always conduct thorough research and consult with a qualified financial advisor before making investment decisions.

## Acknowledgments

- Data provided by Yahoo Finance via the `yfinance` library
- Chart.js for visualization capabilities
- Inspired by traditional financial analysis methodologies
