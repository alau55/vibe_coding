# Quick Start Guide

Get the Multi-Model Stock Valuation Tool up and running in 5 minutes!

## Prerequisites

- Python 3.8+ installed
- Internet connection (for Yahoo Finance data)
- A modern web browser

## Installation (3 Steps)

### Step 1: Clone the Repository

```bash
git clone https://github.com/alau55/vibe_coding.git
cd vibe_coding/multi-model-stock-valuation
```

### Step 2: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note:** If `yfinance` fails to install, try:
```bash
pip install --no-deps yfinance
pip install pandas requests lxml beautifulsoup4
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```
You should see: `Running on http://0.0.0.0:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
python -m http.server 8000
```

**Open Browser:**
Navigate to: `http://localhost:8000`

## First Valuation (1 Minute)

1. **Enter a ticker:** Type `AAPL` in the search box
2. **Click "Fetch Data"** - Wait for company data to load
3. **Select a model:** Choose "DCF (Discounted Cash Flow)" from dropdown
4. **View parameters:** Review the smart default values
5. **Click "Calculate Valuation"**

Done! You should see:
- Fair value estimate
- Current price comparison
- Verdict (Undervalued/Fairly Valued/Overvalued)
- Confidence score
- Sensitivity analysis chart

## Try More Features

### Compare All Models
Click "Compare All Models" to run all applicable models at once and see consensus valuation.

### Adjust Parameters
- Change growth rates
- Modify discount rates
- Adjust assumptions
- See how valuation changes

### Try Different Stocks
- **Tech:** AAPL, MSFT, GOOGL, NVDA
- **Finance:** JPM, BAC, GS
- **Healthcare:** JNJ, UNH, PFE
- **Dividend:** VZ, T, KO

## Common Issues

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### CORS Errors in Browser
- Make sure backend is running on port 5000
- Frontend should be on port 8000
- Check browser console for errors

### "Ticker not found"
- Verify ticker symbol is correct
- Try adding exchange (e.g., `AAPL.NE` for NEO)
- Some tickers may not have sufficient data

### Slow Data Loading
- Yahoo Finance API can be slow
- First request takes longer (no cache)
- Subsequent requests are faster

## Next Steps

1. **Read Examples:** See [EXAMPLES.md](EXAMPLES.md) for detailed test cases
2. **Understand Models:** Check [README.md](README.md) for model explanations
3. **Deploy:** Follow [DEPLOYMENT.md](DEPLOYMENT.md) to deploy online
4. **Contribute:** Read [CONTRIBUTING.md](CONTRIBUTING.md) to add features

## Keyboard Shortcuts

- `Ctrl + Enter` - Submit form
- `Esc` - Close modals
- `Tab` - Navigate between fields

## Tips for Best Results

### Model Selection
- **DCF** → Use for mature companies with stable cash flows
- **DDM** → Use for dividend aristocrats
- **P/E** → Use for profitable companies
- **PEG** → Use for growth stocks
- **P/B** → Use for banks and financials
- **EV/EBITDA** → Use for capital-intensive industries

### Interpreting Results
- **15%+ above price** = Potentially Undervalued
- **Within ±15%** = Fairly Valued
- **15%+ below price** = Potentially Overvalued

### Confidence Score
- **80-100%** = High confidence in valuation
- **60-79%** = Moderate confidence
- **Below 60%** = Low confidence, more research needed

## Support

**Issues:** https://github.com/alau55/vibe_coding/issues
**Discussions:** https://github.com/alau55/vibe_coding/discussions
**Email:** (Add your email if desired)

## License

MIT License - Free to use and modify

---

**Happy Valuing! 📊📈**

Built with ❤️ using Flask and vanilla JavaScript
