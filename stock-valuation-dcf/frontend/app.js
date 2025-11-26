// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentStockData = null;
let currentValuation = null;
let cashFlowChart = null;
let valueBreakdownChart = null;

// DOM Elements
const tickerInput = document.getElementById('tickerInput');
const searchBtn = document.getElementById('searchBtn');
const calculateBtn = document.getElementById('calculateBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchError = document.getElementById('searchError');

// Section elements
const companyInfoSection = document.getElementById('companyInfo');
const historicalMetricsSection = document.getElementById('historicalMetrics');
const dcfCalculatorSection = document.getElementById('dcfCalculator');
const resultsSection = document.getElementById('results');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
tickerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});
calculateBtn.addEventListener('click', handleCalculate);

document.getElementById('saveBtn')?.addEventListener('click', saveAnalysis);
document.getElementById('exportBtn')?.addEventListener('click', exportToPDF);

// Utility Functions
function formatCurrency(value) {
    if (value >= 1e12) {
        return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
    } else {
        return `$${value.toFixed(2)}`;
    }
}

function formatPercent(value) {
    return `${(value * 100).toFixed(2)}%`;
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    searchError.textContent = message;
    searchError.style.display = 'block';
    setTimeout(() => {
        searchError.style.display = 'none';
    }, 5000);
}

function hideAllSections() {
    companyInfoSection.classList.add('hidden');
    historicalMetricsSection.classList.add('hidden');
    dcfCalculatorSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
}

// API Functions
async function fetchStockData(ticker) {
    const response = await fetch(`${API_BASE_URL}/stock/${ticker}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stock data');
    }

    return data.data;
}

async function calculateValuation(params) {
    const response = await fetch(`${API_BASE_URL}/valuation`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to calculate valuation');
    }

    return data.data;
}

// Event Handlers
async function handleSearch() {
    const ticker = tickerInput.value.trim().toUpperCase();

    if (!ticker) {
        showError('Please enter a stock ticker');
        return;
    }

    try {
        showLoading();
        hideAllSections();
        searchError.style.display = 'none';

        // Fetch stock data
        currentStockData = await fetchStockData(ticker);

        // Display company info
        displayCompanyInfo(currentStockData);

        // Display historical metrics
        displayHistoricalMetrics(currentStockData);

        // Setup DCF calculator with suggested inputs
        setupDCFCalculator(currentStockData);

        // Show sections
        companyInfoSection.classList.remove('hidden');
        historicalMetricsSection.classList.remove('hidden');
        dcfCalculatorSection.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function handleCalculate() {
    if (!currentStockData) {
        showError('Please search for a stock first');
        return;
    }

    try {
        showLoading();

        const ticker = currentStockData.company_info.ticker;
        const growthRate = parseFloat(document.getElementById('growthRate').value) / 100;
        const discountRate = parseFloat(document.getElementById('discountRate').value) / 100;
        const terminalGrowth = parseFloat(document.getElementById('terminalGrowth').value) / 100;
        const projectionYears = parseInt(document.getElementById('projectionYears').value);

        // Calculate valuation
        currentValuation = await calculateValuation({
            ticker: ticker,
            growth_rate: growthRate,
            discount_rate: discountRate,
            terminal_growth_rate: terminalGrowth,
            projection_years: projectionYears
        });

        // Display results
        displayResults(currentValuation);

        // Show results section
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Display Functions
function displayCompanyInfo(data) {
    const info = data.company_info;

    document.getElementById('companyName').textContent = info.company_name;
    document.getElementById('ticker').textContent = info.ticker;
    document.getElementById('currentPrice').textContent = formatCurrency(info.current_price);
    document.getElementById('marketCap').textContent = formatCurrency(info.market_cap);
    document.getElementById('sector').textContent = info.sector;
}

function displayHistoricalMetrics(data) {
    const analysis = data.historical_analysis;

    document.getElementById('revenueCagr').textContent = formatPercent(analysis.revenue_cagr);
    document.getElementById('fcfCagr').textContent = formatPercent(analysis.fcf_cagr);
    document.getElementById('avgFcfMargin').textContent = formatPercent(analysis.average_fcf_margin);
    document.getElementById('latestFcf').textContent = formatCurrency(analysis.latest_fcf);
}

function setupDCFCalculator(data) {
    const suggested = data.suggested_dcf_inputs;

    document.getElementById('growthRate').value = (suggested.suggested_growth_rate * 100).toFixed(1);
    document.getElementById('discountRate').value = (suggested.suggested_discount_rate * 100).toFixed(1);
    document.getElementById('terminalGrowth').value = (suggested.suggested_terminal_growth * 100).toFixed(1);
}

function displayResults(data) {
    const valuation = data.valuation;

    // Current Price vs Fair Value
    document.getElementById('resultCurrentPrice').textContent = formatCurrency(data.current_price);
    document.getElementById('fairValue').textContent = formatCurrency(data.fair_value);

    // Upside/Downside
    const upsideDownside = data.upside_downside_percent;
    const upsideElement = document.getElementById('upsideDownside');
    if (upsideDownside > 0) {
        upsideElement.textContent = `Potential Upside: ${upsideDownside.toFixed(2)}%`;
        upsideElement.className = 'upside-downside positive';
    } else {
        upsideElement.textContent = `Potential Downside: ${Math.abs(upsideDownside).toFixed(2)}%`;
        upsideElement.className = 'upside-downside negative';
    }

    // Breakdown
    document.getElementById('pvCashFlows').textContent = formatCurrency(valuation.pv_fcf_sum);
    document.getElementById('pvTerminalValue').textContent = formatCurrency(valuation.pv_terminal_value);
    document.getElementById('enterpriseValue').textContent = formatCurrency(valuation.enterprise_value);
    document.getElementById('equityValue').textContent = formatCurrency(valuation.equity_value);

    // Charts
    displayCashFlowChart(valuation);
    displayValueBreakdownChart(valuation);

    // Sensitivity Table
    displaySensitivityTable(data.sensitivity);
}

function displayCashFlowChart(valuation) {
    const ctx = document.getElementById('cashFlowChart');

    if (cashFlowChart) {
        cashFlowChart.destroy();
    }

    const years = Array.from({ length: valuation.projected_cash_flows.length }, (_, i) => `Year ${i + 1}`);

    cashFlowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Projected FCF',
                    data: valuation.projected_cash_flows,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Discounted FCF',
                    data: valuation.discounted_cash_flows,
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

function displayValueBreakdownChart(valuation) {
    const ctx = document.getElementById('valueBreakdownChart');

    if (valueBreakdownChart) {
        valueBreakdownChart.destroy();
    }

    valueBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PV of Cash Flows', 'PV of Terminal Value'],
            datasets: [{
                data: [valuation.pv_fcf_sum, valuation.pv_terminal_value],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const percentage = valuation[context.dataIndex === 0 ? 'fcf_percentage' : 'terminal_percentage'].toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function displaySensitivityTable(sensitivity) {
    const table = sensitivity.table;
    const container = document.getElementById('sensitivityTable');

    let html = '<table><thead><tr><th>Growth / Discount</th>';

    // Header row (discount rates)
    const discountRates = sensitivity.discount_rates;
    discountRates.forEach(rate => {
        html += `<th>${(rate * 100).toFixed(1)}%</th>`;
    });
    html += '</tr></thead><tbody>';

    // Data rows
    Object.entries(table).forEach(([growthRate, values]) => {
        html += `<tr><td><strong>${growthRate}</strong></td>`;
        Object.values(values).forEach(value => {
            html += `<td>${formatCurrency(value)}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Save and Export Functions
function saveAnalysis() {
    if (!currentValuation) {
        showError('No analysis to save');
        return;
    }

    const analysis = {
        ticker: currentValuation.ticker,
        company_name: currentValuation.company_name,
        timestamp: new Date().toISOString(),
        current_price: currentValuation.current_price,
        fair_value: currentValuation.fair_value,
        upside_downside: currentValuation.upside_downside_percent,
        valuation: currentValuation.valuation
    };

    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
    saved.unshift(analysis);

    // Keep only last 10 analyses
    if (saved.length > 10) {
        saved.pop();
    }

    localStorage.setItem('savedAnalyses', JSON.stringify(saved));

    alert('Analysis saved successfully!');
}

function exportToPDF() {
    if (!currentValuation) {
        showError('No analysis to export');
        return;
    }

    // Create a simple text export (in a real app, you'd use jsPDF or similar)
    const text = `
DCF Valuation Report
====================

Company: ${currentValuation.company_name} (${currentValuation.ticker})
Date: ${new Date().toLocaleDateString()}

Current Price: ${formatCurrency(currentValuation.current_price)}
Fair Value: ${formatCurrency(currentValuation.fair_value)}
Upside/Downside: ${currentValuation.upside_downside_percent.toFixed(2)}%

Enterprise Value: ${formatCurrency(currentValuation.valuation.enterprise_value)}
Equity Value: ${formatCurrency(currentValuation.valuation.equity_value)}

Parameters:
- Growth Rate: ${(currentValuation.valuation.parameters.growth_rate * 100).toFixed(1)}%
- Discount Rate: ${(currentValuation.valuation.parameters.discount_rate * 100).toFixed(1)}%
- Terminal Growth: ${(currentValuation.valuation.parameters.terminal_growth_rate * 100).toFixed(1)}%
    `.trim();

    // Download as text file
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentValuation.ticker}_DCF_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Report exported successfully!');
}

// Initialize
console.log('Stock Valuation DCF Tool loaded');
