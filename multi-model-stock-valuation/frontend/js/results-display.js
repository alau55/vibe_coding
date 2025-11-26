/**
 * Results Display Component
 * Handles display of valuation results and sensitivity analysis
 */

class ResultsDisplay {
    constructor() {
        // Automatically detect environment and use appropriate API URL
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = isLocalhost
            ? 'http://localhost:5000/api'
            : 'https://stock-valuation-api.onrender.com/api';

        this.resultsSection = document.getElementById('resultsSection');
        this.comparisonSection = document.getElementById('comparisonSection');
        this.compareAllBtn = document.getElementById('compareAllBtn');

        this.currentResults = null;
        this.sensitivityChart = null;
        this.stockData = null;

        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        // Listen for valuation results
        document.addEventListener('valuation-calculated', (e) => {
            this.handleValuationCalculated(e.detail.results);
        });

        // Listen for ticker selection to store stock data
        document.addEventListener('ticker-selected', (e) => {
            this.stockData = e.detail.data;
        });

        // Compare all button click
        this.compareAllBtn.addEventListener('click', () => {
            const event = new CustomEvent('compare-all-clicked');
            document.dispatchEvent(event);
        });
    }

    /**
     * Handle valuation calculated event
     */
    async handleValuationCalculated(results) {
        this.currentResults = results;
        this.displayResults(results);
    }

    /**
     * Display valuation results
     */
    displayResults(results) {
        // Display fair value
        this.displayFairValue(results);

        // Display verdict
        this.displayVerdict(results);

        // Display assumptions
        this.displayAssumptions(results);

        // Create sensitivity analysis chart
        this.createSensitivityChart(results);
    }

    /**
     * Display fair value analysis
     */
    displayFairValue(results) {
        const fairValue = document.getElementById('fairValue');
        const priceInResults = document.getElementById('priceInResults');
        const upsideDownside = document.getElementById('upsideDownside');

        const fairValueNum = parseFloat(results.fair_value);
        const currentPrice = parseFloat(this.stockData.current_price);
        const upsidePercent = ((fairValueNum - currentPrice) / currentPrice) * 100;

        fairValue.textContent = `$${fairValueNum.toFixed(2)}`;
        priceInResults.textContent = `$${currentPrice.toFixed(2)}`;

        const upsideText = `${upsidePercent >= 0 ? '+' : ''}${upsidePercent.toFixed(2)}%`;
        upsideDownside.textContent = upsideText;
        upsideDownside.classList.toggle('negative', upsidePercent < 0);
        upsideDownside.classList.toggle('positive', upsidePercent >= 0);
    }

    /**
     * Display verdict badge
     */
    displayVerdict(results) {
        const verdictBadge = document.getElementById('verdictBadge');
        const verdictDescription = document.getElementById('verdictDescription');
        const confidenceBar = document.getElementById('confidenceBar');
        const confidencePercent = document.getElementById('confidencePercent');

        const verdict = results.verdict.toLowerCase();
        const confidence = parseFloat(results.confidence);

        // Set badge
        verdictBadge.textContent = results.verdict;
        verdictBadge.className = `verdict-badge verdict-${verdict}`;

        // Set description
        const verdictDescriptions = {
            undervalued: 'The stock appears to be trading below its intrinsic value. This may present a buying opportunity.',
            fair: 'The stock is trading near its estimated fair value. Consider your investment goals and risk tolerance.',
            overvalued: 'The stock appears to be trading above its intrinsic value. Exercise caution before investing.'
        };

        verdictDescription.textContent = verdictDescriptions[verdict] || 'Valuation analysis complete.';

        // Set confidence
        confidenceBar.style.width = `${Math.min(100, confidence)}%`;
        confidencePercent.textContent = `${Math.round(confidence)}%`;
    }

    /**
     * Display key assumptions
     */
    displayAssumptions(results) {
        const assumptionsList = document.getElementById('assumptionsList');
        assumptionsList.innerHTML = '';

        if (results.assumptions && typeof results.assumptions === 'object') {
            Object.entries(results.assumptions).forEach(([key, value]) => {
                const item = document.createElement('div');
                item.className = 'assumption-item';

                const name = document.createElement('div');
                name.className = 'assumption-name';
                name.textContent = this.formatLabel(key);

                const val = document.createElement('div');
                val.className = 'assumption-value';
                val.textContent = this.formatValue(value);

                item.appendChild(name);
                item.appendChild(val);
                assumptionsList.appendChild(item);
            });
        }
    }

    /**
     * Create sensitivity analysis chart
     */
    createSensitivityChart(results) {
        const canvas = document.getElementById('sensitivityChart');
        const ctx = canvas.getContext('2d');

        // Destroy existing chart if any
        if (this.sensitivityChart) {
            this.sensitivityChart.destroy();
        }

        // Prepare data
        if (!results.sensitivity_analysis) {
            console.warn('No sensitivity analysis data available');
            return;
        }

        const sensitivity = results.sensitivity_analysis;
        const variable = Object.keys(sensitivity)[0];

        if (!variable) {
            console.warn('Empty sensitivity analysis data');
            return;
        }

        const variableData = sensitivity[variable];
        const labels = Object.keys(variableData);
        const values = Object.values(variableData).map(v => parseFloat(v));

        const currentPrice = parseFloat(this.stockData.current_price);

        const colors = values.map(value => {
            if (value > currentPrice * 1.1) return 'rgba(16, 185, 129, 0.8)';
            if (value < currentPrice * 0.9) return 'rgba(239, 68, 68, 0.8)';
            return 'rgba(245, 158, 11, 0.8)';
        });

        this.sensitivityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: `Fair Value (varying ${this.formatLabel(variable)})`,
                        data: values,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: colors,
                        pointBorderColor: colors.map(c => c.replace('0.8', '1')),
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Current Price',
                        data: Array(labels.length).fill(currentPrice),
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: 15,
                            font: { size: 12, weight: '600' },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label.includes('Current Price')) {
                                    return `Current Price: $${context.parsed.y.toFixed(2)}`;
                                }
                                return `Fair Value: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        ticks: {
                            callback: (value) => `$${value.toFixed(0)}`
                        },
                        title: {
                            display: true,
                            text: 'Stock Price'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: this.formatLabel(variable)
                        }
                    }
                }
            }
        });
    }

    /**
     * Format label from key
     */
    formatLabel(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Format value for display
     */
    formatValue(value) {
        if (typeof value === 'number') {
            if (value > 1000) {
                return `${(value / 1000).toFixed(1)}K`;
            }
            if (value < 0.01 && value > 0) {
                return value.toFixed(4);
            }
            return value.toFixed(2);
        }

        if (typeof value === 'string') {
            // Try to parse as number
            const num = parseFloat(value);
            if (!isNaN(num)) {
                return this.formatValue(num);
            }
            // Return string as-is
            return value;
        }

        return String(value);
    }
}

// Initialize component when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.resultsDisplay = new ResultsDisplay();
});
