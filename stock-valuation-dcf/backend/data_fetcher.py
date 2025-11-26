"""
Data Fetcher Module
Fetches stock data and financial statements from Yahoo Finance
"""

import yfinance as yf
import pandas as pd
from typing import Dict, Optional, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StockDataFetcher:
    """Fetches and processes stock data from Yahoo Finance"""

    def __init__(self, ticker: str):
        """
        Initialize the data fetcher for a specific ticker

        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL', 'MSFT')
        """
        self.ticker = ticker.upper()
        self.stock = None
        self._fetch_stock_data()

    def _fetch_stock_data(self) -> None:
        """Fetch stock data from Yahoo Finance"""
        try:
            self.stock = yf.Ticker(self.ticker)
            # Test if ticker is valid
            if not self.stock.info or 'regularMarketPrice' not in self.stock.info:
                raise ValueError(f"Invalid ticker: {self.ticker}")
        except Exception as e:
            logger.error(f"Error fetching data for {self.ticker}: {str(e)}")
            raise ValueError(f"Unable to fetch data for ticker {self.ticker}")

    def get_company_info(self) -> Dict:
        """
        Get basic company information

        Returns:
            Dictionary containing company info
        """
        try:
            info = self.stock.info
            return {
                'ticker': self.ticker,
                'company_name': info.get('longName', 'N/A'),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'current_price': info.get('regularMarketPrice', info.get('currentPrice', 0)),
                'market_cap': info.get('marketCap', 0),
                'currency': info.get('currency', 'USD'),
                'beta': info.get('beta', 1.0),
                'shares_outstanding': info.get('sharesOutstanding', 0)
            }
        except Exception as e:
            logger.error(f"Error getting company info: {str(e)}")
            return {}

    def get_income_statement(self) -> pd.DataFrame:
        """
        Get annual income statement

        Returns:
            DataFrame with income statement data
        """
        try:
            income_stmt = self.stock.financials
            if income_stmt is None or income_stmt.empty:
                logger.warning(f"No income statement data for {self.ticker}")
                return pd.DataFrame()
            return income_stmt
        except Exception as e:
            logger.error(f"Error fetching income statement: {str(e)}")
            return pd.DataFrame()

    def get_balance_sheet(self) -> pd.DataFrame:
        """
        Get annual balance sheet

        Returns:
            DataFrame with balance sheet data
        """
        try:
            balance_sheet = self.stock.balance_sheet
            if balance_sheet is None or balance_sheet.empty:
                logger.warning(f"No balance sheet data for {self.ticker}")
                return pd.DataFrame()
            return balance_sheet
        except Exception as e:
            logger.error(f"Error fetching balance sheet: {str(e)}")
            return pd.DataFrame()

    def get_cash_flow(self) -> pd.DataFrame:
        """
        Get annual cash flow statement

        Returns:
            DataFrame with cash flow data
        """
        try:
            cash_flow = self.stock.cashflow
            if cash_flow is None or cash_flow.empty:
                logger.warning(f"No cash flow data for {self.ticker}")
                return pd.DataFrame()
            return cash_flow
        except Exception as e:
            logger.error(f"Error fetching cash flow: {str(e)}")
            return pd.DataFrame()

    def get_key_metrics(self) -> Dict:
        """
        Extract key financial metrics from financial statements

        Returns:
            Dictionary containing key metrics
        """
        try:
            income_stmt = self.get_income_statement()
            balance_sheet = self.get_balance_sheet()
            cash_flow = self.get_cash_flow()
            info = self.stock.info

            metrics = {
                'revenue': [],
                'operating_income': [],
                'net_income': [],
                'ebitda': [],
                'free_cash_flow': [],
                'total_debt': [],
                'cash': [],
                'years': []
            }

            # Get historical data (last 4 years)
            if not income_stmt.empty:
                for col in income_stmt.columns[:4]:
                    year = col.year
                    metrics['years'].append(year)

                    # Revenue
                    revenue = income_stmt.loc['Total Revenue', col] if 'Total Revenue' in income_stmt.index else 0
                    metrics['revenue'].append(float(revenue))

                    # Operating Income
                    op_income = income_stmt.loc['Operating Income', col] if 'Operating Income' in income_stmt.index else 0
                    metrics['operating_income'].append(float(op_income))

                    # Net Income
                    net_income = income_stmt.loc['Net Income', col] if 'Net Income' in income_stmt.index else 0
                    metrics['net_income'].append(float(net_income))

                    # EBITDA
                    ebitda = income_stmt.loc['EBITDA', col] if 'EBITDA' in income_stmt.index else 0
                    metrics['ebitda'].append(float(ebitda))

            # Free Cash Flow
            if not cash_flow.empty:
                for i, col in enumerate(cash_flow.columns[:4]):
                    if i < len(metrics['years']):
                        fcf = cash_flow.loc['Free Cash Flow', col] if 'Free Cash Flow' in cash_flow.index else 0
                        metrics['free_cash_flow'].append(float(fcf))

            # Debt and Cash from Balance Sheet
            if not balance_sheet.empty:
                for i, col in enumerate(balance_sheet.columns[:4]):
                    if i < len(metrics['years']):
                        # Total Debt
                        total_debt = balance_sheet.loc['Total Debt', col] if 'Total Debt' in balance_sheet.index else 0
                        if total_debt == 0:
                            # Try alternative fields
                            long_term_debt = balance_sheet.loc['Long Term Debt', col] if 'Long Term Debt' in balance_sheet.index else 0
                            short_term_debt = balance_sheet.loc['Current Debt', col] if 'Current Debt' in balance_sheet.index else 0
                            total_debt = long_term_debt + short_term_debt
                        metrics['total_debt'].append(float(total_debt))

                        # Cash
                        cash = balance_sheet.loc['Cash', col] if 'Cash' in balance_sheet.index else 0
                        if cash == 0:
                            cash = balance_sheet.loc['Cash And Cash Equivalents', col] if 'Cash And Cash Equivalents' in balance_sheet.index else 0
                        metrics['cash'].append(float(cash))

            # Pad arrays to ensure they're all the same length
            max_len = len(metrics['years'])
            for key in metrics:
                if key != 'years' and len(metrics[key]) < max_len:
                    metrics[key].extend([0] * (max_len - len(metrics[key])))

            return metrics

        except Exception as e:
            logger.error(f"Error calculating key metrics: {str(e)}")
            return {
                'revenue': [],
                'operating_income': [],
                'net_income': [],
                'ebitda': [],
                'free_cash_flow': [],
                'total_debt': [],
                'cash': [],
                'years': []
            }

    def get_historical_prices(self, period: str = '1y') -> pd.DataFrame:
        """
        Get historical price data

        Args:
            period: Time period (e.g., '1y', '5y', 'max')

        Returns:
            DataFrame with historical prices
        """
        try:
            hist = self.stock.history(period=period)
            return hist
        except Exception as e:
            logger.error(f"Error fetching historical prices: {str(e)}")
            return pd.DataFrame()

    def get_all_data(self) -> Dict:
        """
        Get all available data in a single dictionary

        Returns:
            Dictionary containing all stock data
        """
        return {
            'company_info': self.get_company_info(),
            'key_metrics': self.get_key_metrics(),
            'income_statement': self.get_income_statement().to_dict() if not self.get_income_statement().empty else {},
            'balance_sheet': self.get_balance_sheet().to_dict() if not self.get_balance_sheet().empty else {},
            'cash_flow': self.get_cash_flow().to_dict() if not self.get_cash_flow().empty else {}
        }


def fetch_stock_data(ticker: str) -> Dict:
    """
    Convenience function to fetch stock data

    Args:
        ticker: Stock ticker symbol

    Returns:
        Dictionary containing all stock data
    """
    try:
        fetcher = StockDataFetcher(ticker)
        return {
            'success': True,
            'data': fetcher.get_all_data()
        }
    except Exception as e:
        logger.error(f"Error in fetch_stock_data: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
