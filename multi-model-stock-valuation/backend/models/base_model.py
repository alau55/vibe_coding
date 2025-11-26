"""
Abstract base class for all valuation models
"""
from abc import ABC, abstractmethod
from typing import Dict, Tuple, Any, List


class BaseValuationModel(ABC):
    """Abstract base class for all valuation models"""

    def __init__(self, ticker_data: Dict[str, Any]):
        """
        Initialize the valuation model with ticker data

        Args:
            ticker_data: Comprehensive stock data dictionary
        """
        self.ticker_data = ticker_data
        self.ticker = ticker_data.get('ticker', 'UNKNOWN')
        self.model_name = self._get_model_name()
        self.model_description = self._get_model_description()

    @abstractmethod
    def _get_model_name(self) -> str:
        """Return the name of the valuation model"""
        pass

    @abstractmethod
    def _get_model_description(self) -> str:
        """Return a brief description of the model"""
        pass

    @abstractmethod
    def get_required_inputs(self) -> Dict[str, Dict[str, Any]]:
        """
        Return dictionary of required user inputs with defaults

        Returns:
            Dictionary with input field specifications:
            {
                'field_name': {
                    'label': 'Display Label',
                    'value': default_value,
                    'unit': '%' or '$' or 'ratio',
                    'min': minimum_value,
                    'max': maximum_value,
                    'step': increment_step,
                    'tooltip': 'Explanation of this parameter'
                }
            }
        """
        pass

    @abstractmethod
    def calculate(self, user_inputs: Dict[str, float]) -> Dict[str, Any]:
        """
        Perform valuation calculation

        Args:
            user_inputs: Dictionary of user-provided inputs

        Returns:
            Dictionary containing:
            {
                'fair_value': float,
                'current_price': float,
                'difference_pct': float,
                'verdict': str,  # 'Undervalued', 'Fairly Valued', 'Overvalued'
                'confidence': int,  # 0-100
                'assumptions': dict,
                'sensitivity': dict  # Optional sensitivity analysis data
            }
        """
        pass

    def is_applicable(self) -> Tuple[bool, str]:
        """
        Check if this model is suitable for this stock

        Returns:
            Tuple of (is_applicable: bool, reason: str)
        """
        # Default implementation - override in subclasses for specific checks
        return True, "Model is generally applicable"

    def get_confidence_score(self) -> int:
        """
        Return confidence score 0-100 based on data quality

        Returns:
            Confidence score (0-100)
        """
        data_quality = self.ticker_data.get('data_quality_score', 50)
        return min(100, max(0, int(data_quality)))

    def get_verdict(self, fair_value: float, current_price: float) -> str:
        """
        Determine if stock is undervalued, fairly valued, or overvalued

        Args:
            fair_value: Calculated fair value
            current_price: Current market price

        Returns:
            Verdict string
        """
        if fair_value <= 0 or current_price <= 0:
            return "Unable to determine"

        difference_pct = ((fair_value - current_price) / current_price) * 100

        if difference_pct > 15:
            return "Undervalued"
        elif difference_pct < -15:
            return "Overvalued"
        else:
            return "Fairly Valued"

    def calculate_difference_pct(self, fair_value: float, current_price: float) -> float:
        """
        Calculate percentage difference between fair value and current price

        Args:
            fair_value: Calculated fair value
            current_price: Current market price

        Returns:
            Percentage difference
        """
        if current_price <= 0:
            return 0.0
        return ((fair_value - current_price) / current_price) * 100

    def get_current_price(self) -> float:
        """
        Get current stock price from ticker data

        Returns:
            Current price
        """
        return self.ticker_data.get('current_price', 0.0)

    def get_shares_outstanding(self) -> float:
        """
        Get shares outstanding from ticker data

        Returns:
            Shares outstanding
        """
        return self.ticker_data.get('shares_outstanding', 0.0)

    def safe_divide(self, numerator: float, denominator: float, default: float = 0.0) -> float:
        """
        Safely divide two numbers, returning default if denominator is zero

        Args:
            numerator: Numerator
            denominator: Denominator
            default: Default value to return if division fails

        Returns:
            Result of division or default
        """
        if denominator == 0 or denominator is None:
            return default
        return numerator / denominator

    def format_currency(self, value: float) -> str:
        """Format value as currency"""
        return f"${value:,.2f}"

    def format_percentage(self, value: float) -> str:
        """Format value as percentage"""
        return f"{value:.2f}%"

    def get_model_info(self) -> Dict[str, str]:
        """
        Get model information

        Returns:
            Dictionary with model name and description
        """
        return {
            'name': self.model_name,
            'description': self.model_description
        }
