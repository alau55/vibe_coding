"""
DCF Calculator Module
Performs Discounted Cash Flow valuation calculations
"""

import numpy as np
from typing import Dict, List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DCFCalculator:
    """Performs DCF valuation calculations"""

    def __init__(
        self,
        free_cash_flows: List[float],
        revenue: List[float] = None,
        projection_years: int = 5,
        growth_rate: float = 0.05,
        terminal_growth_rate: float = 0.025,
        discount_rate: float = 0.10,
        shares_outstanding: float = 1,
        total_debt: float = 0,
        cash: float = 0
    ):
        """
        Initialize DCF Calculator

        Args:
            free_cash_flows: Historical free cash flows
            revenue: Historical revenue (optional, for FCF margin calculation)
            projection_years: Number of years to project
            growth_rate: Expected FCF growth rate
            terminal_growth_rate: Perpetual growth rate for terminal value
            discount_rate: WACC or required rate of return
            shares_outstanding: Number of shares outstanding
            total_debt: Total debt
            cash: Cash and cash equivalents
        """
        self.historical_fcf = free_cash_flows
        self.revenue = revenue or []
        self.projection_years = projection_years
        self.growth_rate = growth_rate
        self.terminal_growth_rate = terminal_growth_rate
        self.discount_rate = discount_rate
        self.shares_outstanding = shares_outstanding
        self.total_debt = total_debt
        self.cash = cash

        # Calculated values
        self.projected_fcf = []
        self.discounted_fcf = []
        self.terminal_value = 0
        self.pv_terminal_value = 0
        self.enterprise_value = 0
        self.equity_value = 0
        self.fair_value_per_share = 0

    def project_cash_flows(self) -> List[float]:
        """
        Project future free cash flows based on growth rate

        Returns:
            List of projected cash flows
        """
        if not self.historical_fcf or len(self.historical_fcf) == 0:
            logger.warning("No historical cash flows provided")
            return []

        # Use the most recent FCF as the base
        base_fcf = self.historical_fcf[0]  # Most recent is first

        # If base FCF is negative or zero, use average of positive FCFs
        if base_fcf <= 0:
            positive_fcfs = [fcf for fcf in self.historical_fcf if fcf > 0]
            if positive_fcfs:
                base_fcf = np.mean(positive_fcfs)
            else:
                logger.warning("No positive historical FCFs, using small positive value")
                base_fcf = 1000000  # Default small value

        projected_fcf = []
        for year in range(1, self.projection_years + 1):
            fcf = base_fcf * ((1 + self.growth_rate) ** year)
            projected_fcf.append(fcf)

        self.projected_fcf = projected_fcf
        return projected_fcf

    def calculate_terminal_value(self) -> float:
        """
        Calculate terminal value using perpetuity growth method

        Returns:
            Terminal value
        """
        if not self.projected_fcf:
            self.project_cash_flows()

        if not self.projected_fcf:
            return 0

        # Terminal value = Final year FCF * (1 + terminal growth) / (discount rate - terminal growth)
        final_fcf = self.projected_fcf[-1]
        terminal_value = (final_fcf * (1 + self.terminal_growth_rate)) / \
                        (self.discount_rate - self.terminal_growth_rate)

        self.terminal_value = terminal_value
        return terminal_value

    def discount_cash_flows(self) -> Tuple[List[float], float]:
        """
        Discount projected cash flows and terminal value to present value

        Returns:
            Tuple of (list of discounted cash flows, discounted terminal value)
        """
        if not self.projected_fcf:
            self.project_cash_flows()

        if not self.terminal_value:
            self.calculate_terminal_value()

        discounted_fcf = []
        for year, fcf in enumerate(self.projected_fcf, start=1):
            pv = fcf / ((1 + self.discount_rate) ** year)
            discounted_fcf.append(pv)

        # Discount terminal value
        pv_terminal = self.terminal_value / ((1 + self.discount_rate) ** self.projection_years)

        self.discounted_fcf = discounted_fcf
        self.pv_terminal_value = pv_terminal

        return discounted_fcf, pv_terminal

    def calculate_enterprise_value(self) -> float:
        """
        Calculate enterprise value (sum of discounted cash flows + terminal value)

        Returns:
            Enterprise value
        """
        if not self.discounted_fcf:
            self.discount_cash_flows()

        enterprise_value = sum(self.discounted_fcf) + self.pv_terminal_value
        self.enterprise_value = enterprise_value
        return enterprise_value

    def calculate_equity_value(self) -> float:
        """
        Calculate equity value (enterprise value - debt + cash)

        Returns:
            Equity value
        """
        if not self.enterprise_value:
            self.calculate_enterprise_value()

        equity_value = self.enterprise_value - self.total_debt + self.cash
        self.equity_value = equity_value
        return equity_value

    def calculate_fair_value_per_share(self) -> float:
        """
        Calculate fair value per share

        Returns:
            Fair value per share
        """
        if not self.equity_value:
            self.calculate_equity_value()

        if self.shares_outstanding <= 0:
            logger.warning("Invalid shares outstanding")
            return 0

        fair_value = self.equity_value / self.shares_outstanding
        self.fair_value_per_share = fair_value
        return fair_value

    def run_valuation(self) -> Dict:
        """
        Run complete DCF valuation

        Returns:
            Dictionary with all valuation results
        """
        try:
            # Run all calculations
            self.project_cash_flows()
            self.calculate_terminal_value()
            self.discount_cash_flows()
            self.calculate_enterprise_value()
            self.calculate_equity_value()
            self.calculate_fair_value_per_share()

            # Calculate breakdown percentages
            pv_fcf_sum = sum(self.discounted_fcf)
            fcf_percentage = (pv_fcf_sum / self.enterprise_value * 100) if self.enterprise_value > 0 else 0
            terminal_percentage = (self.pv_terminal_value / self.enterprise_value * 100) if self.enterprise_value > 0 else 0

            return {
                'projected_cash_flows': self.projected_fcf,
                'discounted_cash_flows': self.discounted_fcf,
                'terminal_value': self.terminal_value,
                'pv_terminal_value': self.pv_terminal_value,
                'enterprise_value': self.enterprise_value,
                'equity_value': self.equity_value,
                'fair_value_per_share': self.fair_value_per_share,
                'pv_fcf_sum': pv_fcf_sum,
                'fcf_percentage': fcf_percentage,
                'terminal_percentage': terminal_percentage,
                'parameters': {
                    'projection_years': self.projection_years,
                    'growth_rate': self.growth_rate,
                    'terminal_growth_rate': self.terminal_growth_rate,
                    'discount_rate': self.discount_rate,
                    'shares_outstanding': self.shares_outstanding,
                    'total_debt': self.total_debt,
                    'cash': self.cash
                }
            }
        except Exception as e:
            logger.error(f"Error in DCF valuation: {str(e)}")
            raise

    def sensitivity_analysis(
        self,
        growth_rates: List[float] = None,
        discount_rates: List[float] = None
    ) -> Dict:
        """
        Perform sensitivity analysis on growth and discount rates

        Args:
            growth_rates: List of growth rates to test
            discount_rates: List of discount rates to test

        Returns:
            Dictionary with sensitivity analysis results
        """
        if growth_rates is None:
            growth_rates = [self.growth_rate - 0.02, self.growth_rate, self.growth_rate + 0.02]

        if discount_rates is None:
            discount_rates = [self.discount_rate - 0.02, self.discount_rate, self.discount_rate + 0.02]

        results = []

        for growth in growth_rates:
            for discount in discount_rates:
                # Create temporary calculator with different rates
                temp_calc = DCFCalculator(
                    free_cash_flows=self.historical_fcf,
                    revenue=self.revenue,
                    projection_years=self.projection_years,
                    growth_rate=growth,
                    terminal_growth_rate=self.terminal_growth_rate,
                    discount_rate=discount,
                    shares_outstanding=self.shares_outstanding,
                    total_debt=self.total_debt,
                    cash=self.cash
                )

                valuation = temp_calc.run_valuation()

                results.append({
                    'growth_rate': growth,
                    'discount_rate': discount,
                    'fair_value_per_share': valuation['fair_value_per_share']
                })

        # Create a table format
        table = {}
        for growth in growth_rates:
            table[f"{growth:.1%}"] = {}
            for discount in discount_rates:
                matching = [r for r in results if r['growth_rate'] == growth and r['discount_rate'] == discount]
                if matching:
                    table[f"{growth:.1%}"][f"{discount:.1%}"] = matching[0]['fair_value_per_share']

        return {
            'results': results,
            'table': table,
            'growth_rates': growth_rates,
            'discount_rates': discount_rates
        }


def calculate_dcf(
    free_cash_flows: List[float],
    growth_rate: float = 0.05,
    discount_rate: float = 0.10,
    shares_outstanding: float = 1,
    total_debt: float = 0,
    cash: float = 0,
    projection_years: int = 5,
    terminal_growth_rate: float = 0.025
) -> Dict:
    """
    Convenience function to calculate DCF valuation

    Args:
        free_cash_flows: Historical free cash flows
        growth_rate: Expected FCF growth rate
        discount_rate: WACC or required rate of return
        shares_outstanding: Number of shares outstanding
        total_debt: Total debt
        cash: Cash and cash equivalents
        projection_years: Number of years to project
        terminal_growth_rate: Perpetual growth rate

    Returns:
        Dictionary with valuation results
    """
    try:
        calculator = DCFCalculator(
            free_cash_flows=free_cash_flows,
            projection_years=projection_years,
            growth_rate=growth_rate,
            terminal_growth_rate=terminal_growth_rate,
            discount_rate=discount_rate,
            shares_outstanding=shares_outstanding,
            total_debt=total_debt,
            cash=cash
        )

        return {
            'success': True,
            'valuation': calculator.run_valuation(),
            'sensitivity': calculator.sensitivity_analysis()
        }
    except Exception as e:
        logger.error(f"Error calculating DCF: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
