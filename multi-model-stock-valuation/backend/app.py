"""
Flask API for Multi-Model Stock Valuation Tool
Version: 1.0.0 - Production Ready
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import get_config
from data.data_fetcher import DataFetcher
from data.peer_finder import PeerFinder
from models import DCFModel, DDMModel, PEModel, EVEBITDAModel, PBModel, PEGModel
from typing import Dict, Any
import traceback
import yfinance as yf

# Initialize Flask app
app = Flask(__name__)

# CORS configuration - Allow all origins for now (suitable for free tier/demo)
# This allows the frontend to communicate with the backend from any domain
CORS(app, resources={
    r"/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

# Load configuration
config = get_config()
app.config.from_object(config)

# Initialize data fetcher and peer finder
data_fetcher = DataFetcher(cache_timeout=config.CACHE_TIMEOUT)
peer_finder = PeerFinder()

# Model registry
MODELS = {
    'DCF': DCFModel,
    'DDM': DDMModel,
    'PE': PEModel,
    'EV_EBITDA': EVEBITDAModel,
    'PB': PBModel,
    'PEG': PEGModel
}

# Model metadata
MODEL_INFO = {
    'DCF': {
        'id': 'DCF',
        'name': 'DCF (Discounted Cash Flow)',
        'description': 'Values a company based on projected future free cash flows',
        'best_for': 'Companies with predictable cash flows',
        'category': 'Intrinsic'
    },
    'DDM': {
        'id': 'DDM',
        'name': 'DDM (Dividend Discount Model)',
        'description': 'Values a company based on future dividend stream',
        'best_for': 'Dividend-paying stocks with consistent history',
        'category': 'Intrinsic'
    },
    'PE': {
        'id': 'PE',
        'name': 'P/E Comparables',
        'description': 'Values a company using peer P/E multiples',
        'best_for': 'Mature, profitable companies',
        'category': 'Relative'
    },
    'EV_EBITDA': {
        'id': 'EV_EBITDA',
        'name': 'EV/EBITDA Comparables',
        'description': 'Values a company using peer EV/EBITDA multiples',
        'best_for': 'Capital-intensive industries',
        'category': 'Relative'
    },
    'PB': {
        'id': 'PB',
        'name': 'Price-to-Book',
        'description': 'Values a company using peer P/B multiples',
        'best_for': 'Financial institutions and asset-heavy companies',
        'category': 'Relative'
    },
    'PEG': {
        'id': 'PEG',
        'name': 'PEG Ratio',
        'description': 'Values a company using P/E adjusted for growth',
        'best_for': 'Growth stocks',
        'category': 'Hybrid'
    }
}


@app.route('/')
def index():
    """API root endpoint"""
    return jsonify({
        'name': 'Multi-Model Stock Valuation API',
        'version': '1.0.0',
        'endpoints': {
            '/api/ticker/search': 'POST - Search for ticker symbols',
            '/api/stock/fetch': 'POST - Fetch comprehensive stock data',
            '/api/models/list': 'GET - List all available models',
            '/api/models/check-applicability': 'POST - Check if model is suitable',
            '/api/models/get-inputs': 'POST - Get model input parameters',
            '/api/valuation/calculate': 'POST - Calculate valuation',
            '/api/valuation/compare-all': 'POST - Compare all models'
        }
    })


@app.route('/api')
@app.route('/api/')
def api_index():
    """API base endpoint - same as root"""
    return jsonify({
        'name': 'Multi-Model Stock Valuation API',
        'version': '1.0.0',
        'status': 'active',
        'endpoints': {
            '/api/ticker/search': 'POST - Search for ticker symbols',
            '/api/stock/fetch': 'POST - Fetch comprehensive stock data',
            '/api/models/list': 'GET - List all available models',
            '/api/models/check-applicability': 'POST - Check if model is suitable',
            '/api/models/get-inputs': 'POST - Get model input parameters',
            '/api/valuation/calculate': 'POST - Calculate valuation',
            '/api/valuation/compare-all': 'POST - Compare all models'
        }
    })


@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'service': 'stock-valuation-api',
        'version': '1.0.0'
    }), 200


@app.route('/api/ticker/search', methods=['POST'])
def search_ticker():
    """Search for ticker symbols"""
    try:
        data = request.get_json()
        query = data.get('query', '')

        if not query or len(query) < 1:
            return jsonify({'error': 'Query must be at least 1 character'}), 400

        # Simplified: Just validate the ticker exists by trying to fetch basic info
        query = query.upper().strip()

        try:
            stock = yf.Ticker(query)
            info = stock.info

            # Check if we got valid data
            if info and (info.get('symbol') or info.get('shortName') or info.get('longName')):
                tickers = [{
                    'ticker': query,
                    'displaySymbol': info.get('symbol', query),
                    'description': info.get('longName', info.get('shortName', query))
                }]
            else:
                # Even if info is minimal, if ticker object exists, consider it valid
                tickers = [{
                    'ticker': query,
                    'displaySymbol': query,
                    'description': query
                }]

            return jsonify({
                'tickers': tickers,
                'count': len(tickers)
            })

        except Exception as ticker_error:
            # If ticker fetch fails, return empty
            return jsonify({
                'tickers': [],
                'count': 0,
                'error': f'Ticker {query} not found'
            }), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stock/fetch', methods=['POST'])
def fetch_stock():
    """Fetch comprehensive stock data"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', '')

        if not ticker:
            return jsonify({'error': 'Ticker is required'}), 400

        # Fetch stock data
        stock_data = data_fetcher.fetch_stock_data(ticker)

        # Return stock data directly (frontend expects fields at root level)
        return jsonify(stock_data)

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': f'Error fetching stock data: {str(e)}'}), 500


@app.route('/api/models/list', methods=['GET'])
def list_models():
    """List all available valuation models"""
    return jsonify({
        'models': list(MODEL_INFO.values()),
        'count': len(MODEL_INFO)
    })


@app.route('/api/models/check-applicability', methods=['POST'])
def check_applicability():
    """Check if a model is suitable for a stock"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', '')
        model_id = data.get('model', '')

        if not ticker or not model_id:
            return jsonify({'error': 'Ticker and model are required'}), 400

        if model_id not in MODELS:
            return jsonify({'error': f'Unknown model: {model_id}'}), 400

        # Fetch stock data
        stock_data = data_fetcher.fetch_stock_data(ticker)

        # Get peer data if needed for comparables models
        if model_id in ['PE', 'EV_EBITDA', 'PB']:
            peer_data = peer_finder.find_peers(stock_data)
            stock_data['peer_data'] = peer_data

        # Instantiate model and check applicability
        ModelClass = MODELS[model_id]
        model = ModelClass(stock_data)
        is_applicable, reason = model.is_applicable()
        confidence = model.get_confidence_score()

        return jsonify({
            'applicable': is_applicable,
            'reason': reason,
            'confidence': confidence,
            'model_info': MODEL_INFO[model_id]
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': f'Error checking applicability: {str(e)}'}), 500


@app.route('/api/models/get-inputs', methods=['POST'])
def get_model_inputs():
    """Get input parameters for a model with smart defaults"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', '')
        model_id = data.get('model', '')

        if not ticker or not model_id:
            return jsonify({'error': 'Ticker and model are required'}), 400

        if model_id not in MODELS:
            return jsonify({'error': f'Unknown model: {model_id}'}), 400

        # Fetch stock data
        stock_data = data_fetcher.fetch_stock_data(ticker)

        # Get peer data if needed
        if model_id in ['PE', 'EV_EBITDA', 'PB']:
            peer_data = peer_finder.find_peers(stock_data)
            stock_data['peer_data'] = peer_data

        # Instantiate model and get inputs
        ModelClass = MODELS[model_id]
        model = ModelClass(stock_data)
        inputs = model.get_required_inputs()

        return jsonify({
            'inputs': inputs,
            'model_info': MODEL_INFO[model_id]
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': f'Error getting inputs: {str(e)}'}), 500


@app.route('/api/valuation/calculate', methods=['POST'])
def calculate_valuation():
    """Calculate valuation using specified model"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', '')
        model_id = data.get('model', '')
        user_inputs = data.get('inputs', {})

        if not ticker or not model_id:
            return jsonify({'error': 'Ticker and model are required'}), 400

        if model_id not in MODELS:
            return jsonify({'error': f'Unknown model: {model_id}'}), 400

        # Fetch stock data
        stock_data = data_fetcher.fetch_stock_data(ticker)

        # Get peer data if needed
        if model_id in ['PE', 'EV_EBITDA', 'PB']:
            peer_data = peer_finder.find_peers(stock_data)
            stock_data['peer_data'] = peer_data

        # Instantiate model
        ModelClass = MODELS[model_id]
        model = ModelClass(stock_data)

        # Check if applicable
        is_applicable, reason = model.is_applicable()
        if not is_applicable:
            return jsonify({
                'error': f'Model not applicable: {reason}',
                'applicable': False
            }), 400

        # Calculate valuation
        result = model.calculate(user_inputs)

        # Add model info
        result['model'] = MODEL_INFO[model_id]
        result['ticker'] = ticker

        return jsonify({
            'success': True,
            'result': result
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        app.logger.error(f"Calculation error: {traceback.format_exc()}")
        return jsonify({'error': f'Calculation error: {str(e)}'}), 500


@app.route('/api/valuation/compare-all', methods=['POST'])
def compare_all_models():
    """Run all applicable models and compare results"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', '')

        if not ticker:
            return jsonify({'error': 'Ticker is required'}), 400

        # Fetch stock data
        stock_data = data_fetcher.fetch_stock_data(ticker)

        # Get peer data
        peer_data = peer_finder.find_peers(stock_data)
        stock_data['peer_data'] = peer_data

        results = []
        applicable_results = []

        # Try each model
        for model_id, ModelClass in MODELS.items():
            try:
                model = ModelClass(stock_data)
                is_applicable, reason = model.is_applicable()

                model_result = {
                    'model_id': model_id,
                    'model_info': MODEL_INFO[model_id],
                    'applicable': is_applicable,
                    'reason': reason
                }

                if is_applicable:
                    # Get default inputs
                    default_inputs = model.get_required_inputs()
                    user_inputs = {k: v['value'] for k, v in default_inputs.items()}

                    # Calculate
                    calculation = model.calculate(user_inputs)
                    model_result['result'] = calculation
                    applicable_results.append(calculation['fair_value'])

                results.append(model_result)

            except Exception as e:
                app.logger.error(f"Error with {model_id}: {traceback.format_exc()}")
                results.append({
                    'model_id': model_id,
                    'model_info': MODEL_INFO[model_id],
                    'applicable': False,
                    'reason': f'Error: {str(e)}'
                })

        # Calculate consensus
        consensus = None
        if applicable_results:
            consensus = {
                'fair_value_avg': sum(applicable_results) / len(applicable_results),
                'fair_value_min': min(applicable_results),
                'fair_value_max': max(applicable_results),
                'current_price': stock_data.get('current_price', 0),
                'models_used': len(applicable_results)
            }

            # Calculate consensus verdict
            avg_diff = ((consensus['fair_value_avg'] - consensus['current_price']) /
                       consensus['current_price']) * 100
            if avg_diff > 15:
                consensus['verdict'] = 'Undervalued'
            elif avg_diff < -15:
                consensus['verdict'] = 'Overvalued'
            else:
                consensus['verdict'] = 'Fairly Valued'

        return jsonify({
            'success': True,
            'ticker': ticker,
            'results': results,
            'consensus': consensus
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        app.logger.error(f"Compare all error: {traceback.format_exc()}")
        return jsonify({'error': f'Error comparing models: {str(e)}'}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(
        debug=app.config['DEBUG'],
        host='0.0.0.0',
        port=5000
    )
