"""
EV/EBITDA Ratio Comparables Model
Values company based on peer EV/EBITDA multiples
"""
from typing import Dict, Any, Tuple
from .base_model import BaseValuationModel


class EVEBITDAModel(BaseValuationModel):
    """
    EV/EBITDA Comparables Valuation Model
    Calculates enterprise value using industry EV/EBITDA multiples
    """

    def _get_model_name(self) -> str:
        return "EV/EBITDA Comparables"

    def _get_model_description(self) -> str:
        return "Values a company using peer EV/EBITDA multiples applied to company EBITDA"

    def is_applicable(self) -> Tuple[bool, str]:
        """Check if EV/EBITDA model is suitable for this stock"""
        # Check if we have EBITDA data
        income_statement = self.ticker_data.get('income_statement', {})
        ebitda = income_statement.get('ebitda', {})

        if not ebitda:
            return False, "Missing EBITDA data"

        # Check if we have debt and cash data
        balance_sheet = self.ticker_data.get('balance_sheet', {})
        total_debt = balance_sheet.get('total_debt', {})
        cash = balance_sheet.get('cash', {})

        if not total_debt and not cash:
            return False, "Missing debt and cash data for net debt calculation"

        # Check if we have peer data
        peers = self.ticker_data.get('peers', {})
        if not peers or len(peers) < 2:
            return False, "Insufficient peer company data"

        return True, "Stock has EBITDA and peer data suitable for EV/EBITDA analysis"

    def get_required_inputs(self) -> Dict[str, Dict[str, Any]]:
        """Get required inputs with smart defaults"""
        # Calculate defaults from data
        ebitda_multiple = self._calculate_default_ebitda_multiple()
        company_ebitda = self._calculate_default_ebitda()
        net_debt = self._calculate_default_net_debt()

        return {
            'industry_ev_ebitda': {
                'label': 'Industry EV/EBITDA Multiple',
                'value': ebitda_multiple,
                'unit': 'ratio',
                'min': 3,
                'max': 30,
                'step': 0.5,
                'tooltip': 'Average EV/EBITDA ratio for comparable peer companies'
            },
            'company_ebitda': {
                'label': 'Company EBITDA',
                'value': company_ebitda,
                'unit': '$M',
                'min': 0,
                'max': 100000,
                'step': 1,
                'tooltip': 'Expected EBITDA for valuation period (in millions)'
            },
            'net_debt': {
                'label': 'Net Debt',
                'value': net_debt,
                'unit': '$M',
                'min': -10000,
                'max': 100000,
                'step': 1,
                'tooltip': 'Total debt minus cash and equivalents (in millions)'
            }
        }

    def calculate(self, user_inputs: Dict[str, float]) -> Dict[str, Any]:
        """Perform EV/EBITDA comparables valuation"""
        # Extract inputs (convert from millions to actual values for calculations)
        ev_ebitda_multiple = user_inputs.get('industry_ev_ebitda', 12)
        company_ebitda = user_inputs.get('company_ebitda', 1000) * 1_000_000  # Convert M to actual
        net_debt = user_inputs.get('net_debt', 0) * 1_000_000  # Convert M to actual

        # Validate inputs
        if ev_ebitda_multiple <= 0:
            raise ValueError("EV/EBITDA multiple must be positive")

        if company_ebitda <= 0:
            raise ValueError("Company EBITDA must be positive")

        # Calculate Enterprise Value: EV = EBITDA Multiple * EBITDA
        enterprise_value = ev_ebitda_multiple * company_ebitda

        # Calculate Equity Value: Equity = EV - Net Debt
        equity_value = enterprise_value - net_debt

        # Get equity value per share
        shares_outstanding = self.get_shares_outstanding()
        if shares_outstanding <= 0:
            raise ValueError("Invalid shares outstanding")

        fair_value_per_share = equity_value / shares_outstanding

        current_price = self.get_current_price()
        difference_pct = self.calculate_difference_pct(fair_value_per_share, current_price)
        verdict = self.get_verdict(fair_value_per_share, current_price)

        # Calculate implied multiple
        current_ev = (current_price * shares_outstanding) + net_debt
        current_ev_ebitda = self.safe_divide(current_ev, company_ebitda, 0)

        # Get peer analysis
        peer_analysis = self._analyze_peer_multiples()

        return {
            'fair_value': fair_value_per_share,
            'current_price': current_price,
            'difference_pct': difference_pct,
            'verdict': verdict,
            'confidence': self._get_ev_ebitda_confidence(),
            'assumptions': {
                'industry_ev_ebitda_multiple': f"{ev_ebitda_multiple:.2f}x",
                'company_ebitda': f"${company_ebitda / 1_000_000:.1f}M",
                'enterprise_value': f"${enterprise_value / 1_000_000:.1f}M",
                'net_debt': f"${net_debt / 1_000_000:.1f}M",
                'equity_value': f"${equity_value / 1_000_000:.1f}M",
                'current_ev_ebitda': f"{current_ev_ebitda:.2f}x" if current_ev_ebitda > 0 else "N/A"
            },
            'sensitivity': self._calculate_sensitivity(ev_ebitda_multiple, company_ebitda, net_debt),
            'peer_analysis': peer_analysis
        }

    def _calculate_default_ebitda_multiple(self) -> float:
        """Calculate default EV/EBITDA multiple from peer data"""
        peers = self.ticker_data.get('peers', {})

        if not peers:
            return 12.0  # Default EV/EBITDA

        ev_ebitda_multiples = []
        for peer_ticker, peer_data in peers.items():
            peer_ev_ebitda = peer_data.get('ev_ebitda_ratio', None)
            if peer_ev_ebitda and peer_ev_ebitda > 0 and peer_ev_ebitda < 100:  # Filter outliers
                ev_ebitda_multiples.append(peer_ev_ebitda)

        if not ev_ebitda_multiples:
            return 12.0

        # Calculate median (more robust than mean)
        ev_ebitda_multiples.sort()
        n = len(ev_ebitda_multiples)
        if n % 2 == 0:
            median = (ev_ebitda_multiples[n // 2 - 1] + ev_ebitda_multiples[n // 2]) / 2
        else:
            median = ev_ebitda_multiples[n // 2]

        return max(min(median, 30), 3)

    def _calculate_default_ebitda(self) -> float:
        """Calculate default EBITDA for valuation (in millions)"""
        income_statement = self.ticker_data.get('income_statement', {})
        ebitda_data = income_statement.get('ebitda', {})

        if not ebitda_data:
            return 1000  # Default fallback in millions

        ebitda_values = list(ebitda_data.values())
        if not ebitda_values:
            return 1000

        # Most recent EBITDA
        most_recent_ebitda = ebitda_values[-1]

        # Project forward using growth rate
        growth_rates = self.ticker_data.get('growth_rates', {})
        ebitda_growth = growth_rates.get('ebitda_growth', 0.05)

        if most_recent_ebitda > 0:
            projected_ebitda = most_recent_ebitda * (1 + ebitda_growth)
            return projected_ebitda / 1_000_000  # Convert to millions

        return 1000

    def _calculate_default_net_debt(self) -> float:
        """Calculate default net debt (in millions)"""
        balance_sheet = self.ticker_data.get('balance_sheet', {})

        total_debt_data = balance_sheet.get('total_debt', {})
        cash_data = balance_sheet.get('cash', {})

        total_debt = 0
        cash = 0

        if total_debt_data:
            debt_values = list(total_debt_data.values())
            if debt_values:
                total_debt = debt_values[-1]

        if cash_data:
            cash_values = list(cash_data.values())
            if cash_values:
                cash = cash_values[-1]

        net_debt = total_debt - cash
        return net_debt / 1_000_000  # Convert to millions

    def _get_ev_ebitda_confidence(self) -> int:
        """Calculate confidence score for EV/EBITDA valuation"""
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
        """Analyze peer EV/EBITDA multiples for context"""
        peers = self.ticker_data.get('peers', {})

        if not peers:
            return {'peer_count': 0}

        ev_ebitda_multiples = []
        for peer_ticker, peer_data in peers.items():
            peer_ev_ebitda = peer_data.get('ev_ebitda_ratio', None)
            if peer_ev_ebitda and peer_ev_ebitda > 0 and peer_ev_ebitda < 100:
                ev_ebitda_multiples.append({'ticker': peer_ticker, 'ev_ebitda': peer_ev_ebitda})

        if not ev_ebitda_multiples:
            return {'peer_count': len(peers)}

        values = [m['ev_ebitda'] for m in ev_ebitda_multiples]
        return {
            'peer_count': len(ev_ebitda_multiples),
            'average_ev_ebitda': sum(values) / len(values),
            'min_ev_ebitda': min(values),
            'max_ev_ebitda': max(values),
            'median_ev_ebitda': sorted(values)[len(values) // 2]
        }

    def _calculate_sensitivity(self, ev_ebitda_multiple: float, company_ebitda: float,
                              net_debt: float) -> Dict[str, Any]:
        """Calculate sensitivity analysis for different scenarios"""
        sensitivity_data = {}

        # Test different multiples
        multiple_scenarios = {
            'low': ev_ebitda_multiple - 2,
            'base': ev_ebitda_multiple,
            'high': ev_ebitda_multiple + 2
        }

        # Test different EBITDA estimates
        ebitda_scenarios = {
            'pessimistic': company_ebitda * 0.85,
            'base': company_ebitda,
            'optimistic': company_ebitda * 1.15
        }

        shares_outstanding = self.get_shares_outstanding()

        for ebitda_label, ebitda_val in ebitda_scenarios.items():
            for mult_label, mult_val in multiple_scenarios.items():
                if mult_val > 0:
                    enterprise_value = mult_val * ebitda_val
                    equity_value = enterprise_value - net_debt
                    fair_value = self.safe_divide(equity_value, shares_outstanding, 0)
                    sensitivity_data[f"{ebitda_label}_{mult_label}"] = fair_value
                else:
                    sensitivity_data[f"{ebitda_label}_{mult_label}"] = 0

        return sensitivity_data
