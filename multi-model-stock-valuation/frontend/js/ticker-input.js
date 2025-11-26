/**
 * Ticker Input Component
 * Handles stock ticker search and company data fetching
 */

class TickerInput {
    constructor() {
        // Automatically detect environment and use appropriate API URL
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = isLocalhost
            ? 'http://localhost:5000/api'
            : 'https://stock-valuation-api.onrender.com/api';

        this.tickerInput = document.getElementById('tickerInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.tickerError = document.getElementById('tickerError');
        this.companyInfoCard = document.getElementById('companyInfoCard');

        this.currentTicker = null;
        this.stockData = null;

        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search button click
        this.searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });

        // Enter key in input
        this.tickerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Clear error on input
        this.tickerInput.addEventListener('input', () => {
            this.hideError();
        });

        // Auto-format input to uppercase
        this.tickerInput.addEventListener('change', () => {
            this.tickerInput.value = this.tickerInput.value.toUpperCase().trim();
        });
    }

    /**
     * Handle search action
     */
    async handleSearch() {
        const ticker = this.tickerInput.value.toUpperCase().trim();

        // Validate input
        if (!ticker) {
            this.showError('Please enter a valid stock ticker');
            return;
        }

        if (!/^[A-Z0-9]{1,5}$/.test(ticker)) {
            this.showError('Please enter a valid stock ticker (letters and numbers only, 1-5 characters)');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        this.hideError();

        try {
            // Search for ticker
            const searchResponse = await fetch(`${this.API_BASE_URL}/ticker/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: ticker })
            });

            if (!searchResponse.ok) {
                throw new Error('Ticker not found');
            }

            const searchData = await searchResponse.json();
            if (!searchData.tickers || searchData.tickers.length === 0) {
                throw new Error('Ticker not found. Please check the symbol.');
            }

            // Fetch stock data
            const fetchResponse = await fetch(`${this.API_BASE_URL}/stock/fetch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker })
            });

            if (!fetchResponse.ok) {
                throw new Error('Failed to fetch stock data');
            }

            const stockData = await fetchResponse.json();

            this.currentTicker = ticker;
            this.stockData = stockData;

            // Display company info
            this.displayCompanyInfo(searchData.tickers[0], stockData);

            // Emit custom event
            this.emitTickerSelected();

        } catch (error) {
            console.error('Error searching ticker:', error);
            this.showError(error.message || 'Failed to search ticker');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Display company information
     */
    displayCompanyInfo(tickerInfo, stockData) {
        const companyName = document.getElementById('companyName');
        const companySector = document.getElementById('companySector');
        const currentPrice = document.getElementById('currentPrice');
        const priceChange = document.getElementById('priceChange');
        const marketCap = document.getElementById('marketCap');
        const peRatio = document.getElementById('peRatio');
        const pbRatio = document.getElementById('pbRatio');
        const dividendYield = document.getElementById('dividendYield');

        // Set company info
        companyName.textContent = tickerInfo.displaySymbol || this.currentTicker;
        companySector.textContent = tickerInfo.description || 'Stock Information';

        // Set price info
        currentPrice.textContent = `$${parseFloat(stockData.current_price).toFixed(2)}`;

        const changePercent = parseFloat(stockData.change_percent || 0);
        const changeText = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        priceChange.textContent = changeText;
        priceChange.classList.toggle('positive', changePercent >= 0);
        priceChange.classList.toggle('negative', changePercent < 0);

        // Set metrics
        marketCap.textContent = this.formatMarketCap(stockData.market_cap);
        peRatio.textContent = this.formatNumber(stockData.pe_ratio, 2, '-');
        pbRatio.textContent = this.formatNumber(stockData.pb_ratio, 2, '-');
        dividendYield.textContent = this.formatNumber(stockData.dividend_yield, 2, '-', '%');

        // Show company info card
        this.companyInfoCard.classList.remove('hidden');

        // Scroll to company info
        setTimeout(() => {
            this.companyInfoCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    /**
     * Format market cap value
     */
    formatMarketCap(value) {
        if (!value || value === '-') return '-';
        const num = parseFloat(value);
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        return num.toFixed(0);
    }

    /**
     * Format number with optional suffix
     */
    formatNumber(value, decimals = 2, defaultValue = '-', suffix = '') {
        if (!value || value === '-' || value === null || value === undefined) {
            return defaultValue;
        }
        const num = parseFloat(value);
        if (isNaN(num)) return defaultValue;
        return num.toFixed(decimals) + suffix;
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        const btnText = this.searchBtn.querySelector('.btn-text');
        const btnLoader = this.searchBtn.querySelector('.btn-loader');

        this.searchBtn.disabled = isLoading;
        this.tickerInput.disabled = isLoading;

        if (isLoading) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.tickerError.textContent = message;
        this.tickerError.classList.remove('hidden');
    }

    /**
     * Hide error message
     */
    hideError() {
        this.tickerError.classList.add('hidden');
    }

    /**
     * Emit ticker-selected custom event
     */
    emitTickerSelected() {
        const event = new CustomEvent('ticker-selected', {
            detail: {
                ticker: this.currentTicker,
                data: this.stockData
            }
        });
        document.dispatchEvent(event);
    }
}

// Initialize component when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tickerInput = new TickerInput();
});
