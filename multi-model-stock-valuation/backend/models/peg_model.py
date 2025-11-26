"""
PEG Ratio Model (Price/Earnings to Growth)
Values company based on P/E relative to growth rate
"""
from typing import Dict, Any, Tuple
from .base_model import BaseValuationModel


class PEGModel(BaseValuationModel):
    """
    PEG Ratio Valuation Model
    Adjusts P/E valuation based on earnings growth rate
    A PEG of 1.0 is considered fairly valued (P/E = Growth Rate)
    """

    def _get_model_name(self) -> str:
        return "PEG Ratio"

    def _get_model_description(self) -> str:
        return "Values a company by balancing P/E ratio with earnings growth rate (target PEG = 1.0)"

    def is_applicable(self) -> Tuple[bool, str]:
        """Check if PEG model is suitable for this stock"""
        # Check if we have earnings data
        key_metrics = self.ticker_data.get('key_metrics', {})
        eps = key_metrics.get('eps', 0)

        if eps is None or eps <= 0:
            return False, "Stock has negative or missing earnings per share"

        # Check if we have growth rate data
        growth_rates = self.ticker_data.get('growth_rates', {})
        earnings_growth = growth_rates.get('earnings_growth', 0)

        if earnings_growth is None or earnings_growth <= 0:
            return False, "Missing or negative earnings growth rate"

        return True, "Stock has earnings and growth data suitable for PEG analysis"

    def get_required_inputs(self) -> Dict[str, Dict[str, Any]]:
        """Get required inputs with smart defaults"""
        # Calculate defaults from data
        target_eps = self._calculate_default_target_eps()
        earnings_growth = self._calculate_default_earnings_growth()
        target_peg = self._calculate_default_target_peg()

        return {
            'target_eps': {
                'label': 'Target EPS (Earnings Per Share)',
                'value': target_eps,
                'unit': '$',
                'min': -10,
                'max': 100,
                'step': 0.01,
                'tooltip': 'Expected earnings per share for next period'
            },
            'earnings_growth_rate': {
                'label': 'Expected Earnings Growth Rate',
                'value': earnings_growth * 100,
                'unit': '%',
                'min': -20,
                'max': 100,
                'step': 1,
                'tooltip': 'Expected annual earnings growth rate'
            },
            'target_peg_ratio': {
                'label': 'Target PEG Ratio',
                'value': target_peg,
                'unit': 'ratio',
                'min': 0.5,
                'max': 3.0,
                'step': 0.1,
                'tooltip': 'Target PEG ratio (1.0 = fairly valued, lower = undervalued)'
            }
        }

    def calculate(self, user_inputs: Dict[str, float]) -> Dict[str, Any]:
        """Perform PEG ratio valuation"""
        # Extract inputs (convert percentage to decimal)
        target_eps = user_inputs.get('target_eps', 2.0)
        earnings_growth_rate = user_inputs.get('earnings_growth_rate', 15) / 100
        target_peg_ratio = user_inputs.get('target_peg_ratio', 1.0)

        # Validate inputs
        if target_eps <= 0:
            raise ValueError("Target EPS must be positive")

        if earnings_growth_rate <= 0:
            raise ValueError("Earnings growth rate must be positive")

        if target_peg_ratio <= 0:
            raise ValueError("Target PEG ratio must be positive")

        # Calculate fair P/E based on growth rate
        # PEG = P/E / Growth Rate
        # Therefore: P/E = PEG * Growth Rate
        # For target PEG of 1.0, Fair P/E = Growth Rate (as percentage)
        fair_pe_ratio = target_peg_ratio * (earnings_growth_rate * 100)

        # Calculate fair value
        fair_value = fair_pe_ratio * target_eps

        current_price = self.get_current_price()
        difference_pct = self.calculate_difference_pct(fair_value, current_price)
        verdict = self.get_verdict(fair_value, current_price)

        # Calculate current metrics
        current_eps = self.ticker_data.get('key_metrics', {}).get('eps', target_eps)
        current_pe = self.safe_divide(current_price, current_eps, 0)
        current_peg = self.safe_divide(current_pe, (earnings_growth_rate * 100), 0)

        # Growth analysis
        growth_analysis = self._analyze_growth()

        return {
            'fair_value': fair_value,
            'current_price': current_price,
            'difference_pct': difference_pct,
            'verdict': verdict,
            'confidence': self._get_peg_confidence(),
            'assumptions': {
                'target_eps': f"${target_eps:.2f}",
                'earnings_growth_rate': f"{earnings_growth_rate * 100:.1f}%",
                'fair_pe_ratio': f"{fair_pe_ratio:.2f}x",
                'target_peg_ratio': f"{target_peg_ratio:.2f}",
                'current_eps': f"${current_eps:.2f}",
                'current_pe': f"{current_pe:.2f}x" if current_pe > 0 else "N/A",
                'current_peg': f"{current_peg:.2f}" if current_peg > 0 else "N/A"
            },
            'sensitivity': self._calculate_sensitivity(target_eps, earnings_growth_rate, target_peg_ratio),
            'growth_analysis': growth_analysis
        }

    def _calculate_default_target_eps(self) -> float:
        """Calculate default target EPS"""
        key_metrics = self.ticker_data.get('key_metrics', {})
        current_eps = key_metrics.get('eps', 0)

        # Project forward using growth rate
        growth_rates = self.ticker_data.get('growth_rates', {})
        earnings_growth = growth_rates.get('earnings_growth', 0.10)

        if current_eps > 0:
            projected_eps = current_eps * (1 + earnings_growth)
            return max(projected_eps, 0.01)

        return 2.0  # Default fallback

    def _calculate_default_earnings_growth(self) -> float:
        """Calculate default earnings growth rate"""
        growth_rates = self.ticker_data.get('growth_rates', {})
        earnings_growth = growth_rates.get('earnings_growth', 0.10)

        # Cap at reasonable levels
        return max(min(earnings_growth, 1.0), 0.01)  # Between 1% and 100%

    def _calculate_default_target_peg(self) -> float:
        """Calculate default target PEG ratio"""
        # 1.0 is standard - fairly valued if P/E = Growth Rate
        # Can adjust slightly based on company quality and market conditions
        key_metrics = self.ticker_data.get('key_metrics', {})
        roe = key_metrics.get('roe', 0.15)

        # Slightly higher PEG for high-quality companies (high ROE)
        if roe > 0.20:
            return 1.2  # 20% premium for quality
        elif roe > 0.15:
            return 1.1  # 10% premium
        else:
            return 1.0  # Fair value baseline

    def _analyze_growth(self) -> Dict[str, Any]:
        """Analyze earnings growth and quality"""
        growth_rates = self.ticker_data.get('growth_rates', {})
        earnings_growth = growth_rates.get('earnings_growth', 0.10)
        revenue_growth = growth_rates.get('revenue_growth', 0.08)

        key_metrics = self.ticker_data.get('key_metrics', {})
        roe = key_metrics.get('roe', 0.15)
        profit_margin = key_metrics.get('profit_margin', 0.10)

        # Calculate growth quality (earnings growth vs revenue growth)
        quality = 'High' if earnings_growth > revenue_growth else 'Moderate'

        return {
            'earnings_growth_rate': f"{earnings_growth * 100:.1f}%",
            'revenue_growth_rate': f"{revenue_growth * 100:.1f}%",
            'growth_quality': quality,
            'roe': f"{roe * 100:.1f}%",
            'profit_margin': f"{profit_margin * 100:.1f}%"
        }

    def _get_peg_confidence(self) -> int:
        """Calculate confidence score for PEG valuation"""
        base_confidence = self.get_confidence_score()

        # Increase confidence for consistent growth
        growth_rates = self.ticker_data.get('growth_rates', {})
        earnings_growth = growth_rates.get('earnings_growth', 0)

        # PEG works best for companies with consistent, positive growth
        if earnings_growth > 0.05:
            confidence_boost = 15
        elif earnings_growth > 0:
            confidence_boost = 5
        else:
            confidence_boost = -20

        return min(100, max(0, base_confidence + confidence_boost))

    def _calculate_sensitivity(self, target_eps: float, earnings_growth_rate: float,
                              target_peg_ratio: float) -> Dict[str, Any]:
        """Calculate sensitivity analysis for different scenarios"""
        sensitivity_data = {}

        # Test different EPS estimates
        eps_scenarios = {
            'pessimistic': target_eps * 0.85,
            'base': target_eps,
            'optimistic': target_eps * 1.15
        }

        # Test different growth rates
        growth_scenarios = {
            'slow': earnings_growth_rate * 0.8,
            'base': earnings_growth_rate,
            'fast': earnings_growth_rate * 1.2
        }

        # Test different PEG ratios
        peg_scenarios = {
            'undervalued': target_peg_ratio * 0.8,
            'fair': target_peg_ratio,
            'overvalued': target_peg_ratio * 1.2
        }

        for eps_label, eps_val in eps_scenarios.items():
            for growth_label, growth_val in growth_scenarios.items():
                for peg_label, peg_val in peg_scenarios.items():
                    if growth_val > 0:
                        fair_pe = peg_val * (growth_val * 100)
                        scenario_value = fair_pe * eps_val
                    else:
                        scenario_value = 0

                    sensitivity_data[f"{eps_label}_{growth_label}_{peg_label}"] = scenario_value

        return sensitivity_data
