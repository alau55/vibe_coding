/**
 * Multi-Model Stock Valuation Tool - Main Application Controller
 * Coordinates between components and manages global state
 */

class ValuationApp {
    constructor() {
        // Automatically detect environment and use appropriate API URL
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.API_BASE_URL = isLocalhost
            ? 'http://localhost:5000/api'
            : 'https://stock-valuation-api.onrender.com/api';

        console.log('🚀 API Base URL:', this.API_BASE_URL);

        this.state = {
            currentTicker: null,
            stockData: null,
            selectedModel: null,
            valuationResults: null,
            comparisonResults: null,
            models: []
        };
        this.charts = {
            sensitivity: null,
            comparison: null
        };
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.setupEventListeners();
        await this.loadModels();
        this.logAppStart();
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Ticker selected event
        document.addEventListener('ticker-selected', (e) => {
            this.handleTickerSelected(e.detail);
        });

        // Model selected event
        document.addEventListener('model-selected', (e) => {
            this.handleModelSelected(e.detail);
        });

        // Valuation calculated event
        document.addEventListener('valuation-calculated', (e) => {
            this.handleValuationCalculated(e.detail);
        });

        // Compare all models event
        document.addEventListener('compare-all-clicked', (e) => {
            this.handleCompareAll();
        });

        // Assumption toggle
        const assumptionsToggle = document.getElementById('assumptionsToggle');
        if (assumptionsToggle) {
            assumptionsToggle.addEventListener('click', (e) => {
                this.toggleAssumptions(e);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                const form = document.getElementById('valuationForm');
                if (form && !form.classList.contains('hidden')) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    /**
     * Load available models
     */
    async loadModels() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/models/list`);
            if (!response.ok) throw new Error('Failed to load models');
            const data = await response.json();
            this.state.models = data.models || [];
        } catch (error) {
            console.error('Error loading models:', error);
            this.showToast('Failed to load valuation models', 'error');
        }
    }

    /**
     * Handle ticker selected event
     */
    async handleTickerSelected(detail) {
        const { ticker, data } = detail;
        this.state.currentTicker = ticker;
        this.state.stockData = data;

        // Show model section
        document.getElementById('modelSection').classList.remove('hidden');

        // Scroll to model section
        setTimeout(() => {
            document.getElementById('modelSection').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    /**
     * Handle model selected event
     */
    async handleModelSelected(detail) {
        const { modelId, modelName } = detail;
        this.state.selectedModel = modelId;

        // Show form section
        document.getElementById('formSection').classList.remove('hidden');

        // Scroll to form section
        setTimeout(() => {
            document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    /**
     * Handle valuation calculated event
     */
    async handleValuationCalculated(detail) {
        const { results } = detail;
        this.state.valuationResults = results;

        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');

        // Scroll to results
        setTimeout(() => {
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Show success message
        this.showToast('Valuation calculated successfully!', 'success');
    }

    /**
     * Handle compare all models
     */
    async handleCompareAll() {
        try {
            const btn = document.getElementById('compareAllBtn');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');

            // Show loading state
            btn.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');

            const response = await fetch(`${this.API_BASE_URL}/valuation/compare-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker: this.state.currentTicker
                })
            });

            if (!response.ok) throw new Error('Failed to compare models');
            const data = await response.json();

            this.state.comparisonResults = data;
            this.displayComparison(data);

            // Show comparison section
            document.getElementById('comparisonSection').classList.remove('hidden');

            // Scroll to comparison
            setTimeout(() => {
                document.getElementById('comparisonSection').scrollIntoView({ behavior: 'smooth' });
            }, 100);

            this.showToast('Comparison complete!', 'success');
        } catch (error) {
            console.error('Error comparing models:', error);
            this.showToast('Failed to compare models: ' + error.message, 'error');
        } finally {
            const btn = document.getElementById('compareAllBtn');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            btn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    /**
     * Display comparison results
     */
    displayComparison(comparisonData) {
        const tableBody = document.getElementById('comparisonTableBody');
        const consensusFairValue = document.getElementById('consensusFairValue');
        const consensusVerdict = document.getElementById('consensusVerdict');
        const modelsAgreeing = document.getElementById('modelsAgreeing');

        // Clear table
        tableBody.innerHTML = '';

        // Populate table
        comparisonData.results.forEach(result => {
            const row = document.createElement('tr');
            const verdict = result.verdict.toLowerCase();
            const verdictClass = `verdict-${verdict}`;

            row.innerHTML = `
                <td class="model-name">${result.model_name}</td>
                <td class="value-cell">$${parseFloat(result.fair_value).toFixed(2)}</td>
                <td class="value-cell ${result.upside_downside >= 0 ? '' : 'negative'}">${parseFloat(result.upside_downside).toFixed(2)}%</td>
                <td class="verdict-cell ${verdictClass}">${result.verdict}</td>
                <td>${parseFloat(result.confidence).toFixed(0)}%</td>
            `;
            tableBody.appendChild(row);
        });

        // Update consensus
        if (comparisonData.consensus) {
            consensusFairValue.textContent = `$${parseFloat(comparisonData.consensus.average_fair_value).toFixed(2)}`;
            consensusVerdict.textContent = comparisonData.consensus.consensus_verdict;
            modelsAgreeing.textContent = `${comparisonData.consensus.models_agreeing}/${comparisonData.results.length}`;
        }

        // Create comparison chart
        this.createComparisonChart(comparisonData);
    }

    /**
     * Create comparison chart
     */
    createComparisonChart(comparisonData) {
        const canvas = document.getElementById('comparisonChart');
        const ctx = canvas.getContext('2d');

        // Destroy existing chart if any
        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }

        const labels = comparisonData.results.map(r => r.model_name);
        const fairValues = comparisonData.results.map(r => parseFloat(r.fair_value));
        const currentPrice = this.state.stockData.current_price;

        const backgroundColors = comparisonData.results.map(r => {
            const upside = parseFloat(r.upside_downside);
            if (upside > 0) return 'rgba(16, 185, 129, 0.8)';
            if (upside < 0) return 'rgba(239, 68, 68, 0.8)';
            return 'rgba(245, 158, 11, 0.8)';
        });

        this.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Fair Value',
                        data: fairValues,
                        backgroundColor: backgroundColors,
                        borderColor: backgroundColors.map(c => c.replace('0.8', '1')),
                        borderWidth: 2,
                        borderRadius: 8,
                        order: 1
                    },
                    {
                        label: 'Current Price',
                        data: Array(labels.length).fill(currentPrice),
                        type: 'line',
                        borderColor: '#2563eb',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                        tension: 0,
                        order: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label === 'Fair Value') {
                                    return `Fair Value: $${context.parsed.y.toFixed(2)}`;
                                }
                                return `Current Price: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `$${value.toFixed(0)}`
                        }
                    }
                }
            }
        });
    }

    /**
     * Toggle assumptions visibility
     */
    toggleAssumptions(e) {
        const toggle = e.currentTarget;
        const content = document.getElementById('assumptionsContent');

        toggle.setAttribute('aria-expanded',
            toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
        );
        content.classList.toggle('hidden');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = {
            success: '',
            error: '',
            info: '9'
        }[type] || '9';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        const timeout = setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        });
    }

    /**
     * Log app start
     */
    logAppStart() {
        console.log('Multi-Model Stock Valuation Tool initialized');
        console.log('API Base URL:', this.API_BASE_URL);
        console.log('Available Models:', this.state.models);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ValuationApp();
});
