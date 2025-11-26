"""
Data fetcher module for fetching comprehensive stock data from Yahoo Finance
"""
import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import time


class DataFetcher:
    """Fetches comprehensive stock data from Yahoo Finance"""

    def __init__(self, cache_timeout: int = 3600):
        """
        Initialize DataFetcher

        Args:
            cache_timeout: Cache timeout in seconds (default 1 hour)
        """
        self.cache = {}
        self.cache_timeout = cache_timeout

    def fetch_stock_data(self, ticker: str) -> Dict[str, Any]:
        """
        Fetch comprehensive stock data for a given ticker

        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL')

        Returns:
            Dictionary containing comprehensive stock data
        """
        ticker = ticker.upper().strip()

        # Check cache
        if self._is_cached(ticker):
            return self.cache[ticker]['data']

        try:
            stock = yf.Ticker(ticker)

            # Fetch all data
            data = {
                'ticker': ticker,
                'fetch_timestamp': datetime.now().isoformat(),

                # Basic info
                'company_info': self._get_company_info(stock),

                # Current price and volume
                'current_price': self._get_current_price(stock),
                'volume': self._get_volume(stock),

                # Financial statements
                'income_statement': self._get_income_statement(stock),
                'balance_sheet': self._get_balance_sheet(stock),
                'cash_flow': self._get_cash_flow(stock),

                # Key metrics
                'key_metrics': self._get_key_metrics(stock),

                # Historical data
                'historical_prices': self._get_historical_prices(stock),

                # Calculated metrics
                'growth_rates': self._calculate_growth_rates(stock),

                # Data quality score
                'data_quality_score': 0,  # Will be calculated

                # Shares outstanding
                'shares_outstanding': self._get_shares_outstanding(stock),
            }

            # Calculate data quality score
            data['data_quality_score'] = self._calculate_data_quality(data)

            # Cache the data
            self._cache_data(ticker, data)

            return data

        except Exception as e:
            raise ValueError(f"Error fetching data for {ticker}: {str(e)}")

    def _get_company_info(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Get company information"""
        try:
            info = stock.info
            return {
                'name': info.get('longName', info.get('shortName', 'N/A')),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'market_cap': info.get('marketCap', 0),
                'country': info.get('country', 'N/A'),
                'website': info.get('website', 'N/A'),
                'description': info.get('longBusinessSummary', 'N/A'),
            }
        except Exception as e:
            return {
                'name': 'N/A',
                'sector': 'N/A',
                'industry': 'N/A',
                'market_cap': 0,
                'country': 'N/A',
                'website': 'N/A',
                'description': 'N/A',
            }

    def _get_current_price(self, stock: yf.Ticker) -> float:
        """Get current stock price"""
        try:
            info = stock.info
            # Try multiple price fields
            price = (info.get('currentPrice') or
                    info.get('regularMarketPrice') or
                    info.get('previousClose') or 0)
            return float(price)
        except:
            return 0.0

    def _get_volume(self, stock: yf.Ticker) -> int:
        """Get current volume"""
        try:
            info = stock.info
            return info.get('volume', 0) or info.get('regularMarketVolume', 0)
        except:
            return 0

    def _get_shares_outstanding(self, stock: yf.Ticker) -> float:
        """Get shares outstanding"""
        try:
            info = stock.info
            shares = info.get('sharesOutstanding', 0)
            return float(shares) if shares else 0.0
        except:
            return 0.0

    def _get_income_statement(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Get income statement data"""
        try:
            income_stmt = stock.financials
            if income_stmt is None or income_stmt.empty:
                return {}

            # Transpose to make years as columns
            income_stmt = income_stmt.T

            result = {}
            years = income_stmt.index.strftime('%Y').tolist()

            # Extract key metrics
            metrics = {
                'Total Revenue': 'revenue',
                'EBIT': 'ebit',
                'EBITDA': 'ebitda',
                'Net Income': 'net_income',
                'Gross Profit': 'gross_profit',
                'Operating Income': 'operating_income',
            }

            for yf_key, our_key in metrics.items():
                if yf_key in income_stmt.columns:
                    values = income_stmt[yf_key].fillna(0).tolist()
                    result[our_key] = {year: float(val) for year, val in zip(years, values)}

            return result

        except Exception as e:
            return {}

    def _get_balance_sheet(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Get balance sheet data"""
        try:
            balance_sheet = stock.balance_sheet
            if balance_sheet is None or balance_sheet.empty:
                return {}

            balance_sheet = balance_sheet.T
            result = {}
            years = balance_sheet.index.strftime('%Y').tolist()

            metrics = {
                'Total Assets': 'total_assets',
                'Total Liabilities Net Minority Interest': 'total_liabilities',
                'Stockholders Equity': 'stockholders_equity',
                'Total Debt': 'total_debt',
                'Cash And Cash Equivalents': 'cash',
                'Long Term Debt': 'long_term_debt',
            }

            for yf_key, our_key in metrics.items():
                if yf_key in balance_sheet.columns:
                    values = balance_sheet[yf_key].fillna(0).tolist()
                    result[our_key] = {year: float(val) for year, val in zip(years, values)}

            return result

        except Exception as e:
            return {}

    def _get_cash_flow(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Get cash flow statement data"""
        try:
            cash_flow = stock.cashflow
            if cash_flow is None or cash_flow.empty:
                return {}

            cash_flow = cash_flow.T
            result = {}
            years = cash_flow.index.strftime('%Y').tolist()

            metrics = {
                'Operating Cash Flow': 'operating_cash_flow',
                'Free Cash Flow': 'free_cash_flow',
                'Capital Expenditure': 'capex',
                'Dividends Paid': 'dividends_paid',
            }

            for yf_key, our_key in metrics.items():
                if yf_key in cash_flow.columns:
                    values = cash_flow[yf_key].fillna(0).tolist()
                    result[our_key] = {year: float(val) for year, val in zip(years, values)}

            return result

        except Exception as e:
            return {}

    def _get_key_metrics(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Get key financial metrics"""
        try:
            info = stock.info

            return {
                'pe_ratio': info.get('trailingPE', 0) or 0,
                'forward_pe': info.get('forwardPE', 0) or 0,
                'pb_ratio': info.get('priceToBook', 0) or 0,
                'peg_ratio': info.get('pegRatio', 0) or 0,
                'ev_ebitda': info.get('enterpriseToEbitda', 0) or 0,
                'dividend_yield': info.get('dividendYield', 0) or 0,
                'beta': info.get('beta', 1.0) or 1.0,
                'roe': info.get('returnOnEquity', 0) or 0,
                'profit_margin': info.get('profitMargins', 0) or 0,
                'operating_margin': info.get('operatingMargins', 0) or 0,
                'eps': info.get('trailingEps', 0) or 0,
                'forward_eps': info.get('forwardEps', 0) or 0,
                'book_value': info.get('bookValue', 0) or 0,
                'enterprise_value': info.get('enterpriseValue', 0) or 0,
                'debt_to_equity': info.get('debtToEquity', 0) or 0,
            }

        except Exception as e:
            return {}

    def _get_historical_prices(self, stock: yf.Ticker, period: str = '5y') -> Dict[str, Any]:
        """Get historical price data"""
        try:
            hist = stock.history(period=period)
            if hist is None or hist.empty:
                return {}

            return {
                'dates': hist.index.strftime('%Y-%m-%d').tolist(),
                'close': hist['Close'].tolist(),
                'high': hist['High'].tolist(),
                'low': hist['Low'].tolist(),
                'volume': hist['Volume'].tolist(),
            }

        except Exception as e:
            return {}

    def _calculate_growth_rates(self, stock: yf.Ticker) -> Dict[str, float]:
        """Calculate historical growth rates"""
        try:
            income_stmt = stock.financials
            if income_stmt is None or income_stmt.empty:
                return {'revenue_growth': 0, 'earnings_growth': 0}

            income_stmt = income_stmt.T

            # Revenue growth
            revenue_growth = 0
            if 'Total Revenue' in income_stmt.columns:
                revenues = income_stmt['Total Revenue'].dropna()
                if len(revenues) >= 2:
                    # Calculate CAGR
                    years = len(revenues) - 1
                    revenue_growth = (revenues.iloc[-1] / revenues.iloc[0]) ** (1/years) - 1

            # Earnings growth
            earnings_growth = 0
            if 'Net Income' in income_stmt.columns:
                earnings = income_stmt['Net Income'].dropna()
                if len(earnings) >= 2:
                    years = len(earnings) - 1
                    earnings_growth = (earnings.iloc[-1] / earnings.iloc[0]) ** (1/years) - 1

            return {
                'revenue_growth': float(revenue_growth),
                'earnings_growth': float(earnings_growth),
            }

        except Exception as e:
            return {'revenue_growth': 0, 'earnings_growth': 0}

    def _calculate_data_quality(self, data: Dict[str, Any]) -> int:
        """
        Calculate data quality score (0-100)

        Checks completeness of various data fields
        """
        score = 0
        max_score = 100

        # Company info (10 points)
        if data['company_info'].get('name') != 'N/A':
            score += 5
        if data['company_info'].get('sector') != 'N/A':
            score += 5

        # Current price (10 points)
        if data['current_price'] > 0:
            score += 10

        # Income statement (25 points)
        if data['income_statement'].get('revenue'):
            score += 10
        if data['income_statement'].get('net_income'):
            score += 10
        if data['income_statement'].get('ebitda'):
            score += 5

        # Balance sheet (20 points)
        if data['balance_sheet'].get('total_assets'):
            score += 10
        if data['balance_sheet'].get('total_debt'):
            score += 10

        # Cash flow (15 points)
        if data['cash_flow'].get('operating_cash_flow'):
            score += 10
        if data['cash_flow'].get('free_cash_flow'):
            score += 5

        # Key metrics (10 points)
        if data['key_metrics'].get('pe_ratio'):
            score += 5
        if data['key_metrics'].get('beta'):
            score += 5

        # Historical data (10 points)
        if data['historical_prices'].get('close'):
            score += 10

        return min(score, max_score)

    def _is_cached(self, ticker: str) -> bool:
        """Check if ticker data is in cache and not expired"""
        if ticker not in self.cache:
            return False

        cache_time = self.cache[ticker]['timestamp']
        if time.time() - cache_time > self.cache_timeout:
            del self.cache[ticker]
            return False

        return True

    def _cache_data(self, ticker: str, data: Dict[str, Any]) -> None:
        """Cache ticker data"""
        self.cache[ticker] = {
            'timestamp': time.time(),
            'data': data
        }

    def search_ticker(self, query: str) -> List[Dict[str, str]]:
        """
        Search for ticker symbols (basic implementation)

        Args:
            query: Search query

        Returns:
            List of matching tickers with company names
        """
        # This is a simplified version - in production, you'd want a proper ticker search
        query = query.upper().strip()

        try:
            # Try to fetch the ticker directly
            stock = yf.Ticker(query)
            info = stock.info

            if info and info.get('symbol'):
                return [{
                    'ticker': info.get('symbol', query),
                    'name': info.get('longName', info.get('shortName', 'N/A'))
                }]

        except:
            pass

        return []
