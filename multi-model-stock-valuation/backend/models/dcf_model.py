"""
DCF (Discounted Cash Flow) Valuation Model
"""
from typing import Dict, Any, Tuple
from .base_model import BaseValuationModel
from config import Config
import numpy as np


class DCFModel(BaseValuationModel):
    """
    Discounted Cash Flow valuation model
    Projects future free cash flows and discounts them to present value
    """

    def _get_model_name(self) -> str:
        return "DCF (Discounted Cash Flow)"

    def _get_model_description(self) -> str:
        return "Values a company based on projected future free cash flows discounted to present value"

    def is_applicable(self) -> Tuple[bool, str]:
        """Check if DCF is suitable for this stock"""
        # Check if we have free cash flow data
        cash_flow = self.ticker_data.get('cash_flow', {})
        fcf_data = cash_flow.get('free_cash_flow', {})

        if not fcf_data or len(fcf_data) < 2:
            return False, "Insufficient free cash flow data (need at least 2 years)"

        # Check if FCF is mostly negative
        fcf_values = list(fcf_data.values())
        negative_count = sum(1 for v in fcf_values if v < 0)
        if negative_count > len(fcf_values) / 2:
            return False, "Company has mostly negative free cash flow"

        # Check for revenue
        income_statement = self.ticker_data.get('income_statement', {})
        if not income_statement.get('revenue'):
            return False, "Missing revenue data"

        return True, "Company has predictable cash flows suitable for DCF"

    def get_required_inputs(self) -> Dict[str, Dict[str, Any]]:
        """Get required inputs with smart defaults"""
        # Calculate defaults from historical data
        revenue_growth = self._calculate_default_revenue_growth()
        fcf_margin = self._calculate_default_fcf_margin()
        wacc = self._calculate_default_wacc()

        return {
            'revenue_growth': {
                'label': 'Revenue Growth Rate',
                'value': revenue_growth * 100,  # Convert to percentage
                'unit': '%',
                'min': -50,
                'max': 100,
                'step': 0.5,
                'tooltip': 'Expected annual revenue growth rate for projection period'
            },
            'fcf_margin': {
                'label': 'Free Cash Flow Margin',
                'value': fcf_margin * 100,
                'unit': '%',
                'min': -20,
                'max': 50,
                'step': 0.5,
                'tooltip': 'Free cash flow as percentage of revenue'
            },
            'wacc': {
                'label': 'WACC (Discount Rate)',
                'value': wacc * 100,
                'unit': '%',
                'min': 1,
                'max': 30,
                'step': 0.1,
                'tooltip': 'Weighted Average Cost of Capital - required rate of return'
            },
            'terminal_growth': {
                'label': 'Terminal Growth Rate',
                'value': Config.DEFAULT_TERMINAL_GROWTH * 100,
                'unit': '%',
                'min': 0,
                'max': 5,
                'step': 0.1,
                'tooltip': 'Perpetual growth rate after projection period'
            },
            'projection_years': {
                'label': 'Projection Period',
                'value': Config.DEFAULT_PROJECTION_YEARS,
                'unit': 'years',
                'min': 3,
                'max': 10,
                'step': 1,
                'tooltip': 'Number of years to project cash flows'
            }
        }

    def calculate(self, user_inputs: Dict[str, float]) -> Dict[str, Any]:
        """Perform DCF valuation"""
        # Extract inputs (convert percentages to decimals)
        revenue_growth = user_inputs.get('revenue_growth', 10) / 100
        fcf_margin = user_inputs.get('fcf_margin', 15) / 100
        wacc = user_inputs.get('wacc', 10) / 100
        terminal_growth = user_inputs.get('terminal_growth', 2.5) / 100
        projection_years = int(user_inputs.get('projection_years', 5))

        # Get current revenue
        income_statement = self.ticker_data.get('income_statement', {})
        revenue_data = income_statement.get('revenue', {})
        if not revenue_data:
            raise ValueError("Missing revenue data")

        current_revenue = list(revenue_data.values())[-1]  # Most recent year

        # Project free cash flows
        projected_fcfs = []
        for year in range(1, projection_years + 1):
            projected_revenue = current_revenue * ((1 + revenue_growth) ** year)
            projected_fcf = projected_revenue * fcf_margin
            projected_fcfs.append(projected_fcf)

        # Calculate terminal value
        terminal_fcf = projected_fcfs[-1] * (1 + terminal_growth)
        terminal_value = terminal_fcf / (wacc - terminal_growth)

        # Discount cash flows to present value
        pv_fcfs = []
        for year, fcf in enumerate(projected_fcfs, start=1):
            pv = fcf / ((1 + wacc) ** year)
            pv_fcfs.append(pv)

        # Discount terminal value
        pv_terminal = terminal_value / ((1 + wacc) ** projection_years)

        # Enterprise value
        enterprise_value = sum(pv_fcfs) + pv_terminal

        # Adjust for net debt to get equity value
        balance_sheet = self.ticker_data.get('balance_sheet', {})
        total_debt_data = balance_sheet.get('total_debt', {})
        cash_data = balance_sheet.get('cash', {})

        total_debt = list(total_debt_data.values())[-1] if total_debt_data else 0
        cash = list(cash_data.values())[-1] if cash_data else 0
        net_debt = total_debt - cash

        equity_value = enterprise_value - net_debt

        # Fair value per share
        shares_outstanding = self.get_shares_outstanding()
        if shares_outstanding <= 0:
            raise ValueError("Invalid shares outstanding")

        fair_value_per_share = equity_value / shares_outstanding

        # Calculate sensitivity analysis
        sensitivity = self._calculate_sensitivity(
            current_revenue, fcf_margin, wacc, revenue_growth,
            terminal_growth, projection_years, net_debt, shares_outstanding
        )

        current_price = self.get_current_price()
        difference_pct = self.calculate_difference_pct(fair_value_per_share, current_price)
        verdict = self.get_verdict(fair_value_per_share, current_price)

        return {
            'fair_value': fair_value_per_share,
            'current_price': current_price,
            'difference_pct': difference_pct,
            'verdict': verdict,
            'confidence': self.get_confidence_score(),
            'assumptions': {
                'revenue_growth': f"{revenue_growth * 100:.1f}%",
                'fcf_margin': f"{fcf_margin * 100:.1f}%",
                'wacc': f"{wacc * 100:.1f}%",
                'terminal_growth': f"{terminal_growth * 100:.1f}%",
                'projection_years': projection_years,
                'enterprise_value': enterprise_value,
                'net_debt': net_debt,
                'equity_value': equity_value
            },
            'sensitivity': sensitivity
        }

    def _calculate_default_revenue_growth(self) -> float:
        """Calculate default revenue growth from historical data"""
        growth_rates = self.ticker_data.get('growth_rates', {})
        historical_growth = growth_rates.get('revenue_growth', 0.10)

        # Cap at reasonable levels
        return max(min(historical_growth, 0.50), -0.10)

    def _calculate_default_fcf_margin(self) -> float:
        """Calculate default FCF margin from historical data"""
        cash_flow = self.ticker_data.get('cash_flow', {})
        income_statement = self.ticker_data.get('income_statement', {})

        fcf_data = cash_flow.get('free_cash_flow', {})
        revenue_data = income_statement.get('revenue', {})

        if not fcf_data or not revenue_data:
            return 0.15  # Default 15%

        # Get most recent year's data
        fcf_values = list(fcf_data.values())
        revenue_values = list(revenue_data.values())

        if not fcf_values or not revenue_values:
            return 0.15

        avg_fcf = sum(fcf_values[-3:]) / min(3, len(fcf_values))  # Last 3 years
        avg_revenue = sum(revenue_values[-3:]) / min(3, len(revenue_values))

        margin = self.safe_divide(avg_fcf, avg_revenue, 0.15)
        return max(min(margin, 0.50), -0.20)  # Cap between -20% and 50%

    def _calculate_default_wacc(self) -> float:
        """Calculate WACC using CAPM"""
        beta = self.ticker_data.get('key_metrics', {}).get('beta', 1.0)
        risk_free_rate = Config.RISK_FREE_RATE
        market_risk_premium = Config.MARKET_RISK_PREMIUM

        # CAPM: Risk-free rate + Beta * Market risk premium
        cost_of_equity = risk_free_rate + (beta * market_risk_premium)

        # For simplicity, use cost of equity as WACC
        # (In practice, should include cost of debt weighted by capital structure)
        return max(min(cost_of_equity, 0.25), 0.05)  # Between 5% and 25%

    def _calculate_sensitivity(self, current_revenue: float, fcf_margin: float,
                               wacc: float, revenue_growth: float, terminal_growth: float,
                               projection_years: int, net_debt: float,
                               shares_outstanding: float) -> Dict[str, Any]:
        """Calculate sensitivity analysis for different scenarios"""
        sensitivity_data = {}

        # Test different growth rates
        growth_scenarios = {
            'pessimistic': revenue_growth - 0.05,
            'base': revenue_growth,
            'optimistic': revenue_growth + 0.05
        }

        # Test different WACC values
        wacc_scenarios = {
            'low': wacc - 0.02,
            'base': wacc,
            'high': wacc + 0.02
        }

        for growth_label, growth_val in growth_scenarios.items():
            for wacc_label, wacc_val in wacc_scenarios.items():
                scenario_value = self._calculate_value(
                    current_revenue, fcf_margin, wacc_val, growth_val,
                    terminal_growth, projection_years, net_debt, shares_outstanding
                )
                sensitivity_data[f"{growth_label}_{wacc_label}"] = scenario_value

        return sensitivity_data

    def _calculate_value(self, current_revenue: float, fcf_margin: float,
                        wacc: float, revenue_growth: float, terminal_growth: float,
                        projection_years: int, net_debt: float,
                        shares_outstanding: float) -> float:
        """Helper method to calculate value for sensitivity analysis"""
        # Project FCFs
        projected_fcfs = []
        for year in range(1, projection_years + 1):
            projected_revenue = current_revenue * ((1 + revenue_growth) ** year)
            projected_fcf = projected_revenue * fcf_margin
            projected_fcfs.append(projected_fcf)

        # Terminal value
        terminal_fcf = projected_fcfs[-1] * (1 + terminal_growth)
        terminal_value = self.safe_divide(terminal_fcf, (wacc - terminal_growth), 0)

        # PV of FCFs
        pv_fcfs = sum(fcf / ((1 + wacc) ** year)
                     for year, fcf in enumerate(projected_fcfs, start=1))

        # PV of terminal value
        pv_terminal = terminal_value / ((1 + wacc) ** projection_years)

        # Equity value per share
        enterprise_value = pv_fcfs + pv_terminal
        equity_value = enterprise_value - net_debt
        return self.safe_divide(equity_value, shares_outstanding, 0)
