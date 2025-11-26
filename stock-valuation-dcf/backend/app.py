"""
Flask API for Stock Valuation DCF Tool
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from typing import Dict

from data_fetcher import StockDataFetcher, fetch_stock_data
from dcf_calculator import DCFCalculator, calculate_dcf
from financial_metrics import FinancialMetrics, calculate_suggested_dcf_inputs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Stock Valuation DCF API is running'
    }), 200


@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker: str):
    """
    Get stock data and metrics for a given ticker

    Args:
        ticker: Stock ticker symbol

    Returns:
        JSON response with stock data
    """
    try:
        logger.info(f"Fetching data for ticker: {ticker}")

        # Fetch stock data
        result = fetch_stock_data(ticker)

        if not result['success']:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Unknown error')
            }), 400

        company_data = result['data']

        # Calculate suggested DCF inputs
        suggested_inputs = calculate_suggested_dcf_inputs(company_data)

        # Analyze historical metrics
        metrics = company_data.get('key_metrics', {})
        analysis = FinancialMetrics.analyze_historical_metrics(
            revenues=metrics.get('revenue', []),
            free_cash_flows=metrics.get('free_cash_flow', []),
            ebitda=metrics.get('ebitda', []),
            years=metrics.get('years', [])
        )

        return jsonify({
            'success': True,
            'data': {
                'company_info': company_data['company_info'],
                'key_metrics': company_data['key_metrics'],
                'historical_analysis': analysis,
                'suggested_dcf_inputs': suggested_inputs
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching stock data: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/valuation', methods=['POST'])
def calculate_valuation():
    """
    Calculate DCF valuation with custom parameters

    Request body:
    {
        "ticker": "AAPL",
        "growth_rate": 0.05,
        "discount_rate": 0.10,
        "terminal_growth_rate": 0.025,
        "projection_years": 5
    }

    Returns:
        JSON response with valuation results
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Extract parameters
        ticker = data.get('ticker')
        if not ticker:
            return jsonify({
                'success': False,
                'error': 'Ticker is required'
            }), 400

        logger.info(f"Calculating valuation for ticker: {ticker}")

        # Fetch stock data
        stock_result = fetch_stock_data(ticker)
        if not stock_result['success']:
            return jsonify({
                'success': False,
                'error': stock_result.get('error', 'Unable to fetch stock data')
            }), 400

        company_data = stock_result['data']
        metrics = company_data.get('key_metrics', {})
        info = company_data.get('company_info', {})

        # Get DCF parameters (use provided values or defaults)
        growth_rate = data.get('growth_rate', 0.05)
        discount_rate = data.get('discount_rate', 0.10)
        terminal_growth_rate = data.get('terminal_growth_rate', 0.025)
        projection_years = data.get('projection_years', 5)

        # Get financial data
        free_cash_flows = metrics.get('free_cash_flow', [])
        if not free_cash_flows:
            return jsonify({
                'success': False,
                'error': 'No free cash flow data available for this ticker'
            }), 400

        shares_outstanding = info.get('shares_outstanding', 1)
        total_debt = metrics.get('total_debt', [0])[0] if metrics.get('total_debt') else 0
        cash = metrics.get('cash', [0])[0] if metrics.get('cash') else 0

        # Calculate DCF
        dcf_result = calculate_dcf(
            free_cash_flows=free_cash_flows,
            growth_rate=growth_rate,
            discount_rate=discount_rate,
            shares_outstanding=shares_outstanding,
            total_debt=total_debt,
            cash=cash,
            projection_years=projection_years,
            terminal_growth_rate=terminal_growth_rate
        )

        if not dcf_result['success']:
            return jsonify({
                'success': False,
                'error': dcf_result.get('error', 'Error calculating DCF')
            }), 500

        # Add current price and comparison
        current_price = info.get('current_price', 0)
        fair_value = dcf_result['valuation']['fair_value_per_share']

        upside_downside = 0
        if current_price > 0:
            upside_downside = ((fair_value - current_price) / current_price) * 100

        return jsonify({
            'success': True,
            'data': {
                'ticker': ticker,
                'company_name': info.get('company_name', ''),
                'current_price': current_price,
                'fair_value': fair_value,
                'upside_downside_percent': upside_downside,
                'valuation': dcf_result['valuation'],
                'sensitivity': dcf_result['sensitivity']
            }
        }), 200

    except Exception as e:
        logger.error(f"Error calculating valuation: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/sensitivity', methods=['POST'])
def calculate_sensitivity():
    """
    Calculate sensitivity analysis with custom ranges

    Request body:
    {
        "ticker": "AAPL",
        "base_growth_rate": 0.05,
        "base_discount_rate": 0.10,
        "growth_rate_range": [-0.02, 0, 0.02],
        "discount_rate_range": [-0.02, 0, 0.02]
    }

    Returns:
        JSON response with sensitivity analysis
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        ticker = data.get('ticker')
        if not ticker:
            return jsonify({
                'success': False,
                'error': 'Ticker is required'
            }), 400

        # Fetch stock data
        stock_result = fetch_stock_data(ticker)
        if not stock_result['success']:
            return jsonify({
                'success': False,
                'error': stock_result.get('error', 'Unable to fetch stock data')
            }), 400

        company_data = stock_result['data']
        metrics = company_data.get('key_metrics', {})
        info = company_data.get('company_info', {})

        # Get parameters
        base_growth = data.get('base_growth_rate', 0.05)
        base_discount = data.get('base_discount_rate', 0.10)
        growth_range = data.get('growth_rate_range', [-0.02, 0, 0.02])
        discount_range = data.get('discount_rate_range', [-0.02, 0, 0.02])

        # Create absolute rates from ranges
        growth_rates = [base_growth + offset for offset in growth_range]
        discount_rates = [base_discount + offset for offset in discount_range]

        # Get financial data
        free_cash_flows = metrics.get('free_cash_flow', [])
        shares_outstanding = info.get('shares_outstanding', 1)
        total_debt = metrics.get('total_debt', [0])[0] if metrics.get('total_debt') else 0
        cash = metrics.get('cash', [0])[0] if metrics.get('cash') else 0

        # Create DCF calculator
        calculator = DCFCalculator(
            free_cash_flows=free_cash_flows,
            growth_rate=base_growth,
            discount_rate=base_discount,
            shares_outstanding=shares_outstanding,
            total_debt=total_debt,
            cash=cash
        )

        # Run sensitivity analysis
        sensitivity = calculator.sensitivity_analysis(
            growth_rates=growth_rates,
            discount_rates=discount_rates
        )

        return jsonify({
            'success': True,
            'data': sensitivity
        }), 200

    except Exception as e:
        logger.error(f"Error calculating sensitivity: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal error: {str(error)}", exc_info=True)
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    logger.info("Starting Stock Valuation DCF API...")
    app.run(debug=True, host='0.0.0.0', port=5000)
