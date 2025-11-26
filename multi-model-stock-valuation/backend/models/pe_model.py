"""
P/E Ratio Comparables Model
Values stock based on peer P/E multiples and earnings
"""
from typing import Dict, Any, Tuple
from .base_model import BaseValuationModel


class PEModel(BaseValuationModel):
    """
    P/E Ratio Comparables Valuation Model
    Uses peer company P/E multiples to value a company's earnings
    """

    def _get_model_name(self) -> str:
        return "P/E Comparables"

    def _get_model_description(self) -> str:
        return "Values a company by applying industry average P/E ratios to its earnings"

    def is_applicable(self) -> Tuple[bool, str]:
        """Check if P/E model is suitable for this stock"""
        # Check if we have earnings data
        income_statement = self.ticker_data.get('income_statement', {})
        net_income = income_statement.get('net_income', {})

        if not net_income:
            return False, "Missing net income data"

        # Check if we have EPS data
        key_metrics = self.ticker_data.get('key_metrics', {})
        eps = key_metrics.get('eps', 0)

        if eps is None or eps <= 0:
            return False, "Stock has negative or missing earnings per share"

        # Check if we have peer data
        peers = self.ticker_data.get('peers', {})
        if not peers or len(peers) < 2:
            return False, "Insufficient peer company data for comparables"

        return True, "Stock has earnings and peer data suitable for P/E analysis"

    def get_required_inputs(self) -> Dict[str, Dict[str, Any]]:
        """Get required inputs with smart defaults"""
        # Calculate defaults from ticker and peer data
        pe_multiple = self._calculate_default_pe_multiple()
        target_eps = self._calculate_default_eps()
        growth_adjustment = self._calculate_growth_adjustment()

        return {
            'industry_pe_multiple': {
                'label': 'Industry Average P/E Ratio',
                'value': pe_multiple,
                'unit': 'ratio',
                'min': 5,
                'max': 50,
                'step': 0.5,
                'tooltip': 'Average P/E multiple for peer companies in the industry'
            },
            'target_eps': {
                'label': 'Target EPS (Earnings Per Share)',
                'value': target_eps,
                'unit': '$',
                'min': -10,
                'max': 100,
                'step': 0.01,
                'tooltip': 'Expected earnings per share for valuation period'
            },
            'growth_adjustment': {
                'label': 'Growth Rate Adjustment',
                'value': growth_adjustment * 100,
                'unit': '%',
                'min': -20,
                'max': 50,
                'step': 1,
                'tooltip': 'Premium/discount for higher/lower growth than peers'
            }
        }

    def calculate(self, user_inputs: Dict[str, float]) -> Dict[str, Any]:
        """Perform P/E comparables valuation"""
        # Extract inputs
        industry_pe = user_inputs.get('industry_pe_multiple', 15)
        target_eps = user_inputs.get('target_eps', 2.0)
        growth_adjustment = user_inputs.get('growth_adjustment', 0) / 100

        # Validate inputs
        if industry_pe <= 0:
            raise ValueError("P/E multiple must be positive")

        if target_eps <= 0:
            raise ValueError("Target EPS must be positive")

        # Base fair value using industry P/E
        base_fair_value = industry_pe * target_eps

        # Adjust for company's growth rate relative to peers
        # Higher growth companies deserve higher P/E multiples
        adjusted_pe = industry_pe * (1 + growth_adjustment)
        adjusted_fair_value = adjusted_pe * target_eps

        current_price = self.get_current_price()
        difference_pct = self.calculate_difference_pct(adjusted_fair_value, current_price)
        verdict = self.get_verdict(adjusted_fair_value, current_price)

        # Calculate current P/E
        current_pe = self.safe_divide(current_price, target_eps, 0)

        # Get peer analysis
        peer_analysis = self._analyze_peer_multiples()

        return {
            'fair_value': adjusted_fair_value,
            'current_price': current_price,
            'difference_pct': difference_pct,
            'verdict': verdict,
            'confidence': self._get_pe_confidence(),
            'assumptions': {
                'industry_pe_multiple': f"{industry_pe:.2f}x",
                'target_eps': f"${target_eps:.2f}",
                'adjusted_pe_multiple': f"{adjusted_pe:.2f}x",
                'growth_adjustment': f"{growth_adjustment * 100:+.1f}%",
                'current_pe': f"{current_pe:.2f}x" if current_pe > 0 else "N/A"
            },
            'sensitivity': self._calculate_sensitivity(target_eps, industry_pe, growth_adjustment),
            'peer_analysis': peer_analysis
        }

    def _calculate_default_pe_multiple(self) -> float:
        """Calculate default P/E multiple from peer data"""
        peers = self.ticker_data.get('peers', {})

        if not peers:
            return 15.0  # Default P/E

        pe_multiples = []
        for peer_ticker, peer_data in peers.items():
            peer_pe = peer_data.get('pe_ratio', None)
            if peer_pe and peer_pe > 0 and peer_pe < 100:  # Filter outliers
                pe_multiples.append(peer_pe)

        if not pe_multiples:
            return 15.0

        # Calculate median P/E (more robust than mean)
        pe_multiples.sort()
        n = len(pe_multiples)
        if n % 2 == 0:
            median_pe = (pe_multiples[n // 2 - 1] + pe_multiples[n // 2]) / 2
        else:
            median_pe = pe_multiples[n // 2]

        return max(min(median_pe, 50), 5)

    def _calculate_default_eps(self) -> float:
        """Calculate default EPS for valuation"""
        key_metrics = self.ticker_data.get('key_metrics', {})
        current_eps = key_metrics.get('eps', 0)

        # Use growth rate to project forward
        growth_rates = self.ticker_data.get('growth_rates', {})
        eps_growth = growth_rates.get('earnings_growth', 0.08)

        if current_eps > 0:
            # Project forward 1 year
            projected_eps = current_eps * (1 + eps_growth)
            return max(projected_eps, 0.01)

        return 2.0  # Default fallback

    def _calculate_growth_adjustment(self) -> float:
        """Calculate growth rate adjustment vs peers"""
        # Get company growth rate
        growth_rates = self.ticker_data.get('growth_rates', {})
        company_growth = growth_rates.get('earnings_growth', 0.08)

        # Get peer growth rates
        peers = self.ticker_data.get('peers', {})
        if not peers:
            return 0.0

        peer_growths = []
        for peer_ticker, peer_data in peers.items():
            peer_growth = peer_data.get('earnings_growth', 0.08)
            if peer_growth:
                peer_growths.append(peer_growth)

        if not peer_growths:
            return 0.0

        avg_peer_growth = sum(peer_growths) / len(peer_growths)

        # Adjustment: if company grows faster, deserves premium
        # Use PEG-like adjustment: growth difference / growth
        if avg_peer_growth > 0:
            adjustment = (company_growth - avg_peer_growth) / avg_peer_growth
            return max(min(adjustment, 0.5), -0.2)  # Cap at +50% to -20%

        return 0.0

    def _get_pe_confidence(self) -> int:
        """Calculate confidence score for P/E valuation"""
        base_confidence = self.get_confidence_score()

        # Adjust confidence based on peer data quality
        peers = self.ticker_data.get('peers', {})
        peer_count = len(peers) if peers else 0

        if peer_count >= 5:
            confidence_boost = 15
        elif peer_count >= 3:
            confidence_boost = 5
        else:
            confidence_boost = -10

        return min(100, max(0, base_confidence + confidence_boost))

    def _analyze_peer_multiples(self) -> Dict[str, Any]:
        """Analyze peer P/E multiples for context"""
        peers = self.ticker_data.get('peers', {})

        if not peers:
            return {'peer_count': 0}

        pe_multiples = []
        for peer_ticker, peer_data in peers.items():
            peer_pe = peer_data.get('pe_ratio', None)
            if peer_pe and peer_pe > 0 and peer_pe < 100:
                pe_multiples.append({'ticker': peer_ticker, 'pe': peer_pe})

        if not pe_multiples:
            return {'peer_count': len(peers)}

        pe_values = [p['pe'] for p in pe_multiples]
        return {
            'peer_count': len(pe_multiples),
            'average_pe': sum(pe_values) / len(pe_values),
            'min_pe': min(pe_values),
            'max_pe': max(pe_values),
            'median_pe': sorted(pe_values)[len(pe_values) // 2]
        }

    def _calculate_sensitivity(self, target_eps: float, industry_pe: float,
                              growth_adjustment: float) -> Dict[str, Any]:
        """Calculate sensitivity analysis for different scenarios"""
        sensitivity_data = {}

        # Test different P/E multiples
        pe_scenarios = {
            'low': industry_pe - 3,
            'base': industry_pe,
            'high': industry_pe + 3
        }

        # Test different EPS estimates
        eps_scenarios = {
            'pessimistic': target_eps * 0.85,
            'base': target_eps,
            'optimistic': target_eps * 1.15
        }

        for pe_label, pe_val in pe_scenarios.items():
            for eps_label, eps_val in eps_scenarios.items():
                adjusted_pe = pe_val * (1 + growth_adjustment)
                scenario_value = adjusted_pe * eps_val
                sensitivity_data[f"{eps_label}_{pe_label}"] = scenario_value

        return sensitivity_data
