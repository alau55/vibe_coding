"""
Dividend Discount Model (DDM) - Gordon Growth Model
"""
from typing import Dict, Any, Tuple
from .base_model import BaseValuationModel
from config import Config


class DDMModel(BaseValuationModel):
    """
    Dividend Discount Model using Gordon Growth Model
    Calculates stock value based on expected dividend stream
    """

    def _get_model_name(self) -> str:
        return "DDM (Dividend Discount Model)"

    def _get_model_description(self) -> str:
        return "Values a company based on expected dividends using the Gordon Growth Model"

    def is_applicable(self) -> Tuple[bool, str]:
        """Check if DDM is suitable for this stock"""
        # Check if stock pays regular dividends
        dividend_yield = self.ticker_data.get('key_metrics', {}).get('dividend_yield', 0)

        if dividend_yield is None or dividend_yield <= 0:
            return False, "Stock does not pay regular dividends"

        # Check if we have dividend history
        dividends = self.ticker_data.get('dividends', {})
        if not dividends or len(dividends) < 2:
            return False, "Insufficient dividend history (need at least 2 years)"

        return True, "Stock has consistent dividend payment history"

    def get_required_inputs(self) -> Dict[str, Dict[str, Any]]:
        """Get required inputs with smart defaults"""
        # Calculate defaults from historical data
        dividend_growth = self._calculate_default_dividend_growth()
        required_return = self._calculate_default_required_return()
        next_dividend = self._calculate_default_next_dividend()

        return {
            'next_dividend': {
                'label': 'Next Annual Dividend',
                'value': next_dividend,
                'unit': '$',
                'min': 0,
                'max': 100,
                'step': 0.01,
                'tooltip': 'Expected annual dividend per share (D1)'
            },
            'dividend_growth_rate': {
                'label': 'Dividend Growth Rate',
                'value': dividend_growth * 100,
                'unit': '%',
                'min': -10,
                'max': 30,
                'step': 0.5,
                'tooltip': 'Long-term annual growth rate of dividends'
            },
            'required_return': {
                'label': 'Required Return (Discount Rate)',
                'value': required_return * 100,
                'unit': '%',
                'min': 1,
                'max': 25,
                'step': 0.1,
                'tooltip': 'Minimum return required by investors (equity cost of capital)'
            }
        }

    def calculate(self, user_inputs: Dict[str, float]) -> Dict[str, Any]:
        """Perform DDM valuation using Gordon Growth Model"""
        # Extract and validate inputs
        next_dividend = user_inputs.get('next_dividend', 0)
        dividend_growth_rate = user_inputs.get('dividend_growth_rate', 5) / 100
        required_return = user_inputs.get('required_return', 10) / 100

        # Validate inputs
        if next_dividend <= 0:
            raise ValueError("Next dividend must be positive")

        if required_return <= dividend_growth_rate:
            raise ValueError("Required return must be greater than dividend growth rate")

        # Gordon Growth Model: P = D1 / (r - g)
        # Where: P = Fair value per share
        #        D1 = Next year's dividend per share
        #        r = Required rate of return
        #        g = Constant growth rate
        fair_value = next_dividend / (required_return - dividend_growth_rate)

        current_price = self.get_current_price()
        difference_pct = self.calculate_difference_pct(fair_value, current_price)
        verdict = self.get_verdict(fair_value, current_price)

        # Calculate dividend yield
        current_dividend_yield = self.safe_divide(next_dividend, current_price, 0)

        return {
            'fair_value': fair_value,
            'current_price': current_price,
            'difference_pct': difference_pct,
            'verdict': verdict,
            'confidence': self._get_ddm_confidence(),
            'assumptions': {
                'next_dividend': f"${next_dividend:.2f}",
                'dividend_growth_rate': f"{dividend_growth_rate * 100:.2f}%",
                'required_return': f"{required_return * 100:.2f}%",
                'current_dividend_yield': f"{current_dividend_yield * 100:.2f}%"
            },
            'sensitivity': self._calculate_sensitivity(next_dividend, dividend_growth_rate, required_return)
        }

    def _calculate_default_next_dividend(self) -> float:
        """Calculate next dividend from historical data"""
        dividends = self.ticker_data.get('dividends', {})

        if not dividends:
            return 0.5  # Default fallback

        dividend_values = list(dividends.values())
        if not dividend_values:
            return 0.5

        # Most recent dividend
        most_recent = dividend_values[-1]

        # Calculate average growth from last 2-3 dividends
        if len(dividend_values) >= 2:
            growth = (dividend_values[-1] - dividend_values[-2]) / max(dividend_values[-2], 0.01)
            next_div = most_recent * (1 + growth)
            return max(next_div, 0.01)

        return most_recent

    def _calculate_default_dividend_growth(self) -> float:
        """Calculate default dividend growth from historical data"""
        dividends = self.ticker_data.get('dividends', {})

        if not dividends or len(dividends) < 2:
            return 0.05  # Default 5% growth

        dividend_values = list(dividends.values())
        if len(dividend_values) < 2:
            return 0.05

        # Calculate CAGR from first to last dividend
        years = len(dividend_values) - 1
        cagr = (dividend_values[-1] / max(dividend_values[0], 0.01)) ** (1 / years) - 1

        # Cap at reasonable levels
        return max(min(cagr, 0.25), -0.05)

    def _calculate_default_required_return(self) -> float:
        """Calculate required return using CAPM"""
        beta = self.ticker_data.get('key_metrics', {}).get('beta', 1.0)
        risk_free_rate = Config.RISK_FREE_RATE
        market_risk_premium = Config.MARKET_RISK_PREMIUM

        # CAPM: Rf + Beta * (Rm - Rf)
        cost_of_equity = risk_free_rate + (beta * market_risk_premium)

        return max(min(cost_of_equity, 0.25), 0.05)

    def _get_ddm_confidence(self) -> int:
        """Calculate confidence score for DDM valuation"""
        base_confidence = self.get_confidence_score()

        # Increase confidence if we have long dividend history
        dividends = self.ticker_data.get('dividends', {})
        dividend_count = len(dividends) if dividends else 0

        if dividend_count >= 10:
            confidence_boost = 20
        elif dividend_count >= 5:
            confidence_boost = 10
        else:
            confidence_boost = 0

        return min(100, base_confidence + confidence_boost)

    def _calculate_sensitivity(self, next_dividend: float, dividend_growth_rate: float,
                              required_return: float) -> Dict[str, Any]:
        """Calculate sensitivity analysis for different scenarios"""
        sensitivity_data = {}

        # Test different growth rates
        growth_scenarios = {
            'pessimistic': dividend_growth_rate - 0.02,
            'base': dividend_growth_rate,
            'optimistic': dividend_growth_rate + 0.02
        }

        # Test different required returns
        return_scenarios = {
            'low': required_return - 0.02,
            'base': required_return,
            'high': required_return + 0.02
        }

        for growth_label, growth_val in growth_scenarios.items():
            for return_label, return_val in return_scenarios.items():
                if return_val > growth_val:
                    scenario_value = next_dividend / (return_val - growth_val)
                else:
                    scenario_value = 0  # Invalid scenario

                sensitivity_data[f"{growth_label}_{return_label}"] = scenario_value

        return sensitivity_data
