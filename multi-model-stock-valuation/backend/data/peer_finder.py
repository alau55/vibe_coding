"""
Peer finder module for identifying comparable companies
"""
import yfinance as yf
from typing import Dict, Any, List
import pandas as pd


# Predefined peer lists for common companies (fallback)
PEER_GROUPS = {
    'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC', 'ORCL', 'CRM', 'ADBE'],
    'Financial Services': ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'USB', 'PNC', 'TFC', 'COF'],
    'Healthcare': ['UNH', 'JNJ', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'LLY', 'BMY'],
    'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'NKE', 'MCD', 'SBUX', 'TGT', 'LOW', 'TJX', 'BKNG'],
    'Communication Services': ['GOOGL', 'META', 'DIS', 'NFLX', 'CMCSA', 'T', 'VZ', 'TMUS'],
    'Consumer Defensive': ['WMT', 'PG', 'KO', 'PEP', 'COST', 'PM', 'MO', 'CL', 'MDLZ', 'KHC'],
    'Energy': ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL'],
    'Industrials': ['BA', 'CAT', 'GE', 'HON', 'UNP', 'UPS', 'RTX', 'LMT', 'DE', 'MMM'],
    'Real Estate': ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'DLR', 'O', 'WELL', 'AVB'],
    'Utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'SRE', 'XEL', 'ED', 'WEC'],
    'Basic Materials': ['LIN', 'APD', 'SHW', 'ECL', 'DD', 'NEM', 'FCX', 'NUE', 'VMC', 'MLM'],
}


class PeerFinder:
    """Finds comparable companies for valuation analysis"""

    def __init__(self):
        """Initialize PeerFinder"""
        pass

    def find_peers(self, ticker_data: Dict[str, Any], max_peers: int = 8) -> Dict[str, Any]:
        """
        Find peer companies for a given stock

        Args:
            ticker_data: Stock data dictionary from DataFetcher
            max_peers: Maximum number of peers to return

        Returns:
            Dictionary containing peer data and industry averages
        """
        ticker = ticker_data.get('ticker', '')
        sector = ticker_data.get('company_info', {}).get('sector', 'N/A')
        industry = ticker_data.get('company_info', {}).get('industry', 'N/A')
        market_cap = ticker_data.get('company_info', {}).get('market_cap', 0)

        # Get peer tickers
        peer_tickers = self._get_peer_tickers(ticker, sector, industry, market_cap, max_peers)

        # Fetch peer data
        peers_data = []
        for peer_ticker in peer_tickers:
            if peer_ticker == ticker:  # Skip the original ticker
                continue

            peer_info = self._fetch_peer_metrics(peer_ticker)
            if peer_info:
                peers_data.append(peer_info)

        # Calculate industry averages
        industry_averages = self._calculate_industry_averages(peers_data)

        return {
            'peers': peers_data,
            'industry_averages': industry_averages,
            'peer_count': len(peers_data)
        }

    def _get_peer_tickers(self, ticker: str, sector: str, industry: str,
                          market_cap: float, max_peers: int) -> List[str]:
        """
        Get list of peer ticker symbols

        Args:
            ticker: Target ticker symbol
            sector: Company sector
            industry: Company industry
            market_cap: Company market cap
            max_peers: Maximum number of peers

        Returns:
            List of peer ticker symbols
        """
        # Use predefined peer groups based on sector
        if sector in PEER_GROUPS:
            peers = PEER_GROUPS[sector].copy()
            # Remove the original ticker if present
            if ticker in peers:
                peers.remove(ticker)
            return peers[:max_peers]

        # Fallback: return empty list (in production, use screener API)
        return []

    def _fetch_peer_metrics(self, ticker: str) -> Dict[str, Any]:
        """
        Fetch key metrics for a peer company

        Args:
            ticker: Peer ticker symbol

        Returns:
            Dictionary of peer metrics
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info

            if not info or not info.get('symbol'):
                return None

            return {
                'ticker': ticker,
                'name': info.get('longName', info.get('shortName', ticker)),
                'market_cap': info.get('marketCap', 0),
                'pe_ratio': info.get('trailingPE', 0) or 0,
                'forward_pe': info.get('forwardPE', 0) or 0,
                'pb_ratio': info.get('priceToBook', 0) or 0,
                'peg_ratio': info.get('pegRatio', 0) or 0,
                'ev_ebitda': info.get('enterpriseToEbitda', 0) or 0,
                'dividend_yield': info.get('dividendYield', 0) or 0,
                'profit_margin': info.get('profitMargins', 0) or 0,
                'roe': info.get('returnOnEquity', 0) or 0,
                'revenue_growth': info.get('revenueGrowth', 0) or 0,
                'beta': info.get('beta', 1.0) or 1.0,
            }

        except Exception as e:
            return None

    def _calculate_industry_averages(self, peers_data: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Calculate industry average metrics

        Args:
            peers_data: List of peer data dictionaries

        Returns:
            Dictionary of industry average metrics
        """
        if not peers_data:
            return {}

        df = pd.DataFrame(peers_data)

        metrics = {
            'pe_ratio': self._safe_mean(df, 'pe_ratio'),
            'forward_pe': self._safe_mean(df, 'forward_pe'),
            'pb_ratio': self._safe_mean(df, 'pb_ratio'),
            'peg_ratio': self._safe_mean(df, 'peg_ratio'),
            'ev_ebitda': self._safe_mean(df, 'ev_ebitda'),
            'dividend_yield': self._safe_mean(df, 'dividend_yield'),
            'profit_margin': self._safe_mean(df, 'profit_margin'),
            'roe': self._safe_mean(df, 'roe'),
            'revenue_growth': self._safe_mean(df, 'revenue_growth'),
            'beta': self._safe_mean(df, 'beta'),
        }

        # Calculate medians as well (more robust to outliers)
        medians = {
            'pe_ratio_median': self._safe_median(df, 'pe_ratio'),
            'forward_pe_median': self._safe_median(df, 'forward_pe'),
            'pb_ratio_median': self._safe_median(df, 'pb_ratio'),
            'peg_ratio_median': self._safe_median(df, 'peg_ratio'),
            'ev_ebitda_median': self._safe_median(df, 'ev_ebitda'),
        }

        metrics.update(medians)
        return metrics

    def _safe_mean(self, df: pd.DataFrame, column: str) -> float:
        """Calculate mean, excluding zeros and infinities"""
        if column not in df.columns:
            return 0.0

        values = df[column].replace([0, float('inf'), float('-inf')], float('nan'))
        mean_val = values.mean()

        return float(mean_val) if pd.notna(mean_val) else 0.0

    def _safe_median(self, df: pd.DataFrame, column: str) -> float:
        """Calculate median, excluding zeros and infinities"""
        if column not in df.columns:
            return 0.0

        values = df[column].replace([0, float('inf'), float('-inf')], float('nan'))
        median_val = values.median()

        return float(median_val) if pd.notna(median_val) else 0.0
