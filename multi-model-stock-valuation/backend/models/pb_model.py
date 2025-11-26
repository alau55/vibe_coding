"""
Price-to-Book (P/B) Ratio Comparables Model
Values company based on peer P/B multiples and book value
"""
from typing import Dict, Any, Tuple
from .base_model import BaseValuationModel


class PBModel(BaseValuationModel):
    """
    Price-to-Book Comparables Valuation Model
    Especially useful for asset-heavy companies like banks, utilities, manufacturing
    """

    def _get_model_name(self) -> str:
        return "P/B Comparables"

    def _get_model_description(self) -> str:
        return "Values a company using peer P/B multiples adjusted for ROE differences"

    def is_applicable(self) -> Tuple[bool, str]:
        """Check if P/B model is suitable for this stock"""
        # Check if we have book value data
        balance_sheet = self.ticker_data.get('balance_sheet', {})
        total_assets = balance_sheet.get('total_assets', {})
        total_liabilities = balance_sheet.get('total_liabilities', {})

        if not total_assets or not total_liabilities:
            return False, "Missing balance sheet data for book value calculation"

        # Check if we have shares outstanding
        shares = self.get_shares_outstanding()
        if shares <= 0:
            return False, "Invalid shares outstanding"

        # Check if we have peer data
        peers = self.ticker_data.get('peers', {})
        if not peers or len(peers) < 2:
            return False, "Insufficient peer company data"

        # P/B is best for asset-heavy industries
        # Check if company has reasonable book value per share
        key_metrics = self.ticker_data.get('key_metrics', {})
        book_value = self._calculate_book_value_per_share()

        if book_value <= 0:
            return False, "Negative or zero book value"

        return True, "Stock has book value and peer data suitable for P/B analysis"

    def get_required_inputs(self) -> Dict[str, Dict[str, Any]]:
        """Get required inputs with smart defaults"""
        # Calculate defaults from data
        pb_multiple = self._calculate_default_pb_multiple()
        book_value_per_share = self._calculate_book_value_per_share()
        roe_adjustment = self._calculate_roe_adjustment()

        return {
            'industry_pb_multiple': {
                'label': 'Industry Average P/B Multiple',
                'value': pb_multiple,
                'unit': 'ratio',
                'min': 0.5,
                'max': 10,
                'step': 0.1,
                'tooltip': 'Average P/B multiple for comparable peer companies'
            },
            'book_value_per_share': {
                'label': 'Book Value Per Share',
                'value': book_value_per_share,
                'unit': '$',
                'min': 0,
                'max': 1000,
                'step': 0.01,
                'tooltip': 'Company equity book value divided by shares outstanding'
            },
            'roe_adjustment': {
                'label': 'ROE Adjustment',
                'value': roe_adjustment * 100,
                'unit': '%',
                'min': -30,
                'max': 50,
                'step': 1,
                'tooltip': 'Premium/discount for higher/lower ROE than peers'
            }
        }

    def calculate(self, user_inputs: Dict[str, float]) -> Dict[str, Any]:
        """Perform P/B comparables valuation"""
        # Extract inputs
        industry_pb = user_inputs.get('industry_pb_multiple', 1.5)
        book_value_per_share = user_inputs.get('book_value_per_share', 20)
        roe_adjustment = user_inputs.get('roe_adjustment', 0) / 100

        # Validate inputs
        if industry_pb <= 0:
            raise ValueError("P/B multiple must be positive")

        if book_value_per_share <= 0:
            raise ValueError("Book value per share must be positive")

        # Base fair value using industry P/B
        base_fair_value = industry_pb * book_value_per_share

        # Adjust for company's ROE relative to peers
        # Higher ROE companies deserve higher P/B multiples
        adjusted_pb = industry_pb * (1 + roe_adjustment)
        adjusted_fair_value = adjusted_pb * book_value_per_share

        current_price = self.get_current_price()
        difference_pct = self.calculate_difference_pct(adjusted_fair_value, current_price)
        verdict = self.get_verdict(adjusted_fair_value, current_price)

        # Calculate current P/B
        current_pb = self.safe_divide(current_price, book_value_per_share, 0)

        # Get ROE analysis
        roe_analysis = self._analyze_roe()

        return {
            'fair_value': adjusted_fair_value,
            'current_price': current_price,
            'difference_pct': difference_pct,
            'verdict': verdict,
            'confidence': self._get_pb_confidence(),
            'assumptions': {
                'industry_pb_multiple': f"{industry_pb:.2f}x",
                'book_value_per_share': f"${book_value_per_share:.2f}",
                'adjusted_pb_multiple': f"{adjusted_pb:.2f}x",
                'roe_adjustment': f"{roe_adjustment * 100:+.1f}%",
                'current_pb': f"{current_pb:.2f}x" if current_pb > 0 else "N/A"
            },
            'sensitivity': self._calculate_sensitivity(book_value_per_share, industry_pb, roe_adjustment),
            'roe_analysis': roe_analysis
        }

    def _calculate_default_pb_multiple(self) -> float:
        """Calculate default P/B multiple from peer data"""
        peers = self.ticker_data.get('peers', {})

        if not peers:
            return 1.5  # Default P/B

        pb_multiples = []
        for peer_ticker, peer_data in peers.items():
            peer_pb = peer_data.get('pb_ratio', None)
            if peer_pb and peer_pb > 0 and peer_pb < 20:  # Filter outliers
                pb_multiples.append(peer_pb)

        if not pb_multiples:
            return 1.5

        # Calculate median P/B
        pb_multiples.sort()
        n = len(pb_multiples)
        if n % 2 == 0:
            median_pb = (pb_multiples[n // 2 - 1] + pb_multiples[n // 2]) / 2
        else:
            median_pb = pb_multiples[n // 2]

        return max(min(median_pb, 10), 0.5)

    def _calculate_book_value_per_share(self) -> float:
        """Calculate book value per share"""
        balance_sheet = self.ticker_data.get('balance_sheet', {})

        total_assets_data = balance_sheet.get('total_assets', {})
        total_liabilities_data = balance_sheet.get('total_liabilities', {})

        if not total_assets_data or not total_liabilities_data:
            # Try to get from key metrics
            key_metrics = self.ticker_data.get('key_metrics', {})
            book_value_per_share = key_metrics.get('book_value_per_share', 20)
            return max(book_value_per_share, 0.01)

        assets = list(total_assets_data.values())
        liabilities = list(total_liabilities_data.values())

        if not assets or not liabilities:
            return 20  # Default fallback

        # Most recent values
        total_assets = assets[-1]
        total_liabilities = liabilities[-1]

        # Book value (equity) = Assets - Liabilities
        equity_book_value = total_assets - total_liabilities

        shares_outstanding = self.get_shares_outstanding()
        if shares_outstanding <= 0:
            return 20

        book_value_per_share = equity_book_value / shares_outstanding
        return max(book_value_per_share, 0.01)

    def _calculate_roe_adjustment(self) -> float:
        """Calculate ROE adjustment vs peers"""
        # Get company ROE
        key_metrics = self.ticker_data.get('key_metrics', {})
        company_roe = key_metrics.get('roe', 0.10)

        # Get peer ROEs
        peers = self.ticker_data.get('peers', {})
        if not peers:
            return 0.0

        peer_roes = []
        for peer_ticker, peer_data in peers.items():
            peer_roe = peer_data.get('roe', 0.10)
            if peer_roe:
                peer_roes.append(peer_roe)

        if not peer_roes:
            return 0.0

        avg_peer_roe = sum(peer_roes) / len(peer_roes)

        # Adjustment: if company has higher ROE, deserves premium
        # Higher ROE means better returns on equity
        if avg_peer_roe > 0:
            adjustment = (company_roe - avg_peer_roe) / avg_peer_roe
            return max(min(adjustment, 0.5), -0.3)  # Cap at +50% to -30%

        return 0.0

    def _analyze_roe(self) -> Dict[str, Any]:
        """Analyze ROE for company and peers"""
        key_metrics = self.ticker_data.get('key_metrics', {})
        company_roe = key_metrics.get('roe', 0.10)

        peers = self.ticker_data.get('peers', {})

        if not peers:
            return {
                'company_roe': f"{company_roe * 100:.1f}%",
                'peer_count': 0
            }

        peer_roes = []
        for peer_ticker, peer_data in peers.items():
            peer_roe = peer_data.get('roe', None)
            if peer_roe:
                peer_roes.append({'ticker': peer_ticker, 'roe': peer_roe})

        if not peer_roes:
            return {
                'company_roe': f"{company_roe * 100:.1f}%",
                'peer_count': len(peers)
            }

        roe_values = [r['roe'] for r in peer_roes]
        avg_roe = sum(roe_values) / len(roe_values)

        return {
            'company_roe': f"{company_roe * 100:.1f}%",
            'average_peer_roe': f"{avg_roe * 100:.1f}%",
            'min_peer_roe': f"{min(roe_values) * 100:.1f}%",
            'max_peer_roe': f"{max(roe_values) * 100:.1f}%",
            'peer_count': len(peer_roes)
        }

    def _get_pb_confidence(self) -> int:
        """Calculate confidence score for P/B valuation"""
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

    def _calculate_sensitivity(self, book_value_per_share: float, industry_pb: float,
                              roe_adjustment: float) -> Dict[str, Any]:
        """Calculate sensitivity analysis for different scenarios"""
        sensitivity_data = {}

        # Test different P/B multiples
        pb_scenarios = {
            'low': industry_pb - 0.5,
            'base': industry_pb,
            'high': industry_pb + 0.5
        }

        # Test different book values
        book_value_scenarios = {
            'pessimistic': book_value_per_share * 0.90,
            'base': book_value_per_share,
            'optimistic': book_value_per_share * 1.10
        }

        for bv_label, bv_val in book_value_scenarios.items():
            for pb_label, pb_val in pb_scenarios.items():
                if pb_val > 0:
                    adjusted_pb = pb_val * (1 + roe_adjustment)
                    scenario_value = adjusted_pb * bv_val
                else:
                    scenario_value = 0

                sensitivity_data[f"{bv_label}_{pb_label}"] = scenario_value

        return sensitivity_data
