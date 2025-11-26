"""
Financial Metrics Module
Calculates various financial metrics and ratios
"""

import numpy as np
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FinancialMetrics:
    """Calculates financial metrics and ratios"""

    @staticmethod
    def calculate_growth_rate(values: List[float], method: str = 'cagr') -> float:
        """
        Calculate growth rate from historical values

        Args:
            values: List of historical values (most recent first)
            method: 'cagr' for compound annual growth rate, 'average' for simple average

        Returns:
            Growth rate as decimal (e.g., 0.05 for 5%)
        """
        if not values or len(values) < 2:
            logger.warning("Insufficient data for growth rate calculation")
            return 0.0

        # Remove zeros and negatives for growth calculation
        positive_values = [v for v in values if v > 0]
        if len(positive_values) < 2:
            return 0.0

        if method == 'cagr':
            # CAGR = (Ending Value / Beginning Value) ^ (1 / Number of Years) - 1
            beginning_value = positive_values[-1]
            ending_value = positive_values[0]
            num_periods = len(positive_values) - 1

            if beginning_value <= 0:
                return 0.0

            try:
                cagr = (ending_value / beginning_value) ** (1 / num_periods) - 1
                return cagr
            except:
                return 0.0

        elif method == 'average':
            # Calculate year-over-year growth rates and average them
            growth_rates = []
            for i in range(len(positive_values) - 1):
                if positive_values[i + 1] > 0:
                    growth = (positive_values[i] - positive_values[i + 1]) / positive_values[i + 1]
                    growth_rates.append(growth)

            return np.mean(growth_rates) if growth_rates else 0.0

        return 0.0

    @staticmethod
    def calculate_fcf_margin(free_cash_flows: List[float], revenues: List[float]) -> List[float]:
        """
        Calculate Free Cash Flow margin (FCF / Revenue)

        Args:
            free_cash_flows: List of historical FCF values
            revenues: List of historical revenue values

        Returns:
            List of FCF margins as decimals
        """
        if not free_cash_flows or not revenues or len(free_cash_flows) != len(revenues):
            logger.warning("Insufficient or mismatched data for FCF margin calculation")
            return []

        margins = []
        for fcf, revenue in zip(free_cash_flows, revenues):
            if revenue > 0:
                margin = fcf / revenue
                margins.append(margin)
            else:
                margins.append(0.0)

        return margins

    @staticmethod
    def calculate_average_fcf_margin(free_cash_flows: List[float], revenues: List[float]) -> float:
        """
        Calculate average FCF margin

        Args:
            free_cash_flows: List of historical FCF values
            revenues: List of historical revenue values

        Returns:
            Average FCF margin as decimal
        """
        margins = FinancialMetrics.calculate_fcf_margin(free_cash_flows, revenues)
        if not margins:
            return 0.0
        return np.mean(margins)

    @staticmethod
    def calculate_debt_to_equity(total_debt: float, market_cap: float) -> float:
        """
        Calculate Debt-to-Equity ratio

        Args:
            total_debt: Total debt
            market_cap: Market capitalization (proxy for equity value)

        Returns:
            Debt-to-Equity ratio
        """
        if market_cap <= 0:
            return 0.0
        return total_debt / market_cap

    @staticmethod
    def calculate_wacc(
        beta: float,
        risk_free_rate: float = 0.04,
        market_risk_premium: float = 0.08,
        total_debt: float = 0,
        market_cap: float = 1,
        tax_rate: float = 0.21,
        cost_of_debt: float = 0.05
    ) -> float:
        """
        Calculate Weighted Average Cost of Capital (WACC)

        WACC = (E/V * Re) + (D/V * Rd * (1-Tc))
        Where:
        - E = Market value of equity
        - D = Market value of debt
        - V = E + D
        - Re = Cost of equity
        - Rd = Cost of debt
        - Tc = Tax rate

        Args:
            beta: Stock beta
            risk_free_rate: Risk-free rate (10-year Treasury)
            market_risk_premium: Expected market return - risk-free rate
            total_debt: Total debt
            market_cap: Market capitalization
            tax_rate: Corporate tax rate
            cost_of_debt: Cost of debt

        Returns:
            WACC as decimal
        """
        # Calculate cost of equity using CAPM
        # Re = Rf + Beta * (Rm - Rf)
        cost_of_equity = risk_free_rate + (beta * market_risk_premium)

        # Calculate weights
        total_value = market_cap + total_debt
        if total_value <= 0:
            return cost_of_equity

        equity_weight = market_cap / total_value
        debt_weight = total_debt / total_value

        # Calculate WACC
        wacc = (equity_weight * cost_of_equity) + \
               (debt_weight * cost_of_debt * (1 - tax_rate))

        return wacc

    @staticmethod
    def estimate_terminal_growth_rate(
        gdp_growth: float = 0.025,
        inflation: float = 0.02
    ) -> float:
        """
        Estimate terminal growth rate

        Typically should not exceed long-term GDP growth + inflation

        Args:
            gdp_growth: Long-term GDP growth rate
            inflation: Long-term inflation rate

        Returns:
            Terminal growth rate
        """
        return gdp_growth + inflation

    @staticmethod
    def calculate_pe_ratio(price: float, earnings_per_share: float) -> float:
        """
        Calculate Price-to-Earnings ratio

        Args:
            price: Current stock price
            earnings_per_share: Earnings per share

        Returns:
            P/E ratio
        """
        if earnings_per_share <= 0:
            return 0.0
        return price / earnings_per_share

    @staticmethod
    def calculate_ev_to_ebitda(
        enterprise_value: float,
        ebitda: float
    ) -> float:
        """
        Calculate EV/EBITDA multiple

        Args:
            enterprise_value: Enterprise value
            ebitda: EBITDA

        Returns:
            EV/EBITDA ratio
        """
        if ebitda <= 0:
            return 0.0
        return enterprise_value / ebitda

    @staticmethod
    def analyze_historical_metrics(
        revenues: List[float],
        free_cash_flows: List[float],
        ebitda: List[float],
        years: List[int]
    ) -> Dict:
        """
        Analyze historical financial metrics

        Args:
            revenues: Historical revenues
            free_cash_flows: Historical FCF
            ebitda: Historical EBITDA
            years: Corresponding years

        Returns:
            Dictionary with analysis results
        """
        try:
            revenue_growth = FinancialMetrics.calculate_growth_rate(revenues, 'cagr')
            fcf_growth = FinancialMetrics.calculate_growth_rate(free_cash_flows, 'cagr')
            fcf_margins = FinancialMetrics.calculate_fcf_margin(free_cash_flows, revenues)
            avg_fcf_margin = FinancialMetrics.calculate_average_fcf_margin(free_cash_flows, revenues)

            return {
                'revenue_cagr': revenue_growth,
                'fcf_cagr': fcf_growth,
                'fcf_margins': fcf_margins,
                'average_fcf_margin': avg_fcf_margin,
                'latest_revenue': revenues[0] if revenues else 0,
                'latest_fcf': free_cash_flows[0] if free_cash_flows else 0,
                'latest_ebitda': ebitda[0] if ebitda else 0
            }
        except Exception as e:
            logger.error(f"Error analyzing historical metrics: {str(e)}")
            return {}


def calculate_suggested_dcf_inputs(
    company_data: Dict,
    risk_free_rate: float = 0.04,
    market_risk_premium: float = 0.08
) -> Dict:
    """
    Calculate suggested inputs for DCF based on company data

    Args:
        company_data: Company data from data_fetcher
        risk_free_rate: Risk-free rate (10-year Treasury)
        market_risk_premium: Market risk premium

    Returns:
        Dictionary with suggested DCF inputs
    """
    try:
        metrics = company_data.get('key_metrics', {})
        info = company_data.get('company_info', {})

        revenues = metrics.get('revenue', [])
        fcfs = metrics.get('free_cash_flow', [])
        ebitda = metrics.get('ebitda', [])
        years = metrics.get('years', [])

        # Calculate historical growth
        revenue_growth = FinancialMetrics.calculate_growth_rate(revenues)
        fcf_growth = FinancialMetrics.calculate_growth_rate(fcfs)

        # Use conservative growth estimate (lower of revenue or FCF growth, capped at reasonable levels)
        suggested_growth = min(revenue_growth, fcf_growth)
        suggested_growth = max(min(suggested_growth, 0.20), 0.02)  # Cap between 2% and 20%

        # Calculate WACC
        beta = info.get('beta', 1.0)
        total_debt = metrics.get('total_debt', [0])[0] if metrics.get('total_debt') else 0
        market_cap = info.get('market_cap', 0)

        wacc = FinancialMetrics.calculate_wacc(
            beta=beta,
            risk_free_rate=risk_free_rate,
            market_risk_premium=market_risk_premium,
            total_debt=total_debt,
            market_cap=market_cap
        )

        # Terminal growth rate (conservative)
        terminal_growth = min(suggested_growth * 0.5, 0.025)

        return {
            'suggested_growth_rate': suggested_growth,
            'suggested_discount_rate': wacc,
            'suggested_terminal_growth': terminal_growth,
            'revenue_growth': revenue_growth,
            'fcf_growth': fcf_growth,
            'beta': beta,
            'wacc': wacc
        }

    except Exception as e:
        logger.error(f"Error calculating suggested inputs: {str(e)}")
        return {
            'suggested_growth_rate': 0.05,
            'suggested_discount_rate': 0.10,
            'suggested_terminal_growth': 0.025
        }
