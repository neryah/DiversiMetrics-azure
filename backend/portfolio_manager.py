"""
Portfolio Manager Module
Implements Modern Portfolio Theory with Sharpe Ratio Optimization
This is based on what we have in the backend/portfolio_sharpe_ratio.py file
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple

class PortfolioManager:
    def __init__(self, initial_stocks: List[str], initial_weights: List[float], 
                 historical_data: pd.DataFrame, risk_free_rate: float = 0.045):
        """
        Initialize portfolio manager with historical data and positions
        
        Args:
            initial_stocks: List of stock tickers in portfolio
            initial_weights: Investment amounts for each stock
            historical_data: DataFrame with historical adjusted closing prices
            risk_free_rate: Annualized risk-free rate for Sharpe ratio
        """
        self._validate_inputs(initial_stocks, initial_weights)
        self.historical_data = historical_data
        self.risk_free_rate = risk_free_rate
        
        # Clean and align data
        self._clean_historical_data()
        self.stocks = self.historical_data.columns.tolist()
        self.initial_stocks, self.initial_weights = self._clean_initial_positions(
            initial_stocks, initial_weights
        )
        
        # Initialize portfolio state
        self.portfolio_value = sum(self.initial_weights)
        self.portfolio_weights = self._calculate_weights(self.initial_stocks, self.initial_weights)
        self.rolling_returns = self._initialize_rolling_returns()
        
    def _validate_inputs(self, stocks: List[str], weights: List[float]):
        """Validate input parameters"""
        if len(stocks) != len(weights):
            raise ValueError(f"Stocks/weights length mismatch: {len(stocks)} vs {len(weights)}")
        if len(stocks) == 0:
            raise ValueError("Empty portfolio not allowed")
        if any(w < 0 for w in weights):
            raise ValueError("Negative weights not allowed")

    def _clean_historical_data(self):
        """Clean and prepare price data"""
        self.historical_data.ffill(inplace=True)
        self.historical_data.bfill(inplace=True)
        if self.historical_data.isnull().any().any():
            raise ValueError("Historical data contains missing values after cleaning")

    def _clean_initial_positions(self, stocks: List[str], weights: List[float]):
        """Filter valid initial positions"""
        valid = [(s, w) for s, w in zip(stocks, weights) 
                if s in self.historical_data.columns and w > 0]
        if not valid:
            raise ValueError("No valid initial positions")
        return zip(*valid)

    def _calculate_weights(self, stocks: List[str], weights: List[float]) -> Dict[str, float]:
        """Calculate normalized portfolio weights"""
        total = sum(weights)
        return {s: w/total for s, w in zip(stocks, weights)}

    def _initialize_rolling_returns(self) -> np.ndarray:
        """Calculate initial portfolio returns vector"""
        returns = self.historical_data.pct_change().dropna()
        portfolio_returns = returns[list(self.portfolio_weights.keys())].dot(
            list(self.portfolio_weights.values())
        )
        return portfolio_returns.values

    def calculate_sharpe_ratio(self, returns: np.ndarray = None) -> float:
        """
        Calculate annualized Sharpe ratio
        Args:
            returns: Optional returns array (uses portfolio returns if None)
        """
        returns = returns if returns is not None else self.rolling_returns
        if len(returns) < 2:
            return 0.0
            
        annualized_return = np.mean(returns) * 252
        annualized_vol = np.std(returns) * np.sqrt(252)
        
        if annualized_vol < 1e-6:
            return 0.0
            
        return (annualized_return - self.risk_free_rate) / annualized_vol

    def _calculate_updated_returns(self, stock: str, amount: float, is_buy: bool) -> np.ndarray:
        """Calculate hypothetical returns after transaction"""
        if stock not in self.historical_data.columns:
            raise ValueError(f"Stock {stock} not in historical data")
            
        stock_returns = self.historical_data[stock].pct_change().dropna().values
        current_returns = self.rolling_returns
        
        if is_buy:
            new_value = self.portfolio_value + amount
            weight = amount / new_value
            return current_returns * (self.portfolio_value / new_value) + stock_returns * weight
        else:
            if stock not in self.portfolio_weights:
                raise ValueError(f"Stock {stock} not in portfolio")
                
            sell_value = min(amount, self.portfolio_weights[stock] * self.portfolio_value)
            new_value = self.portfolio_value - sell_value
            if new_value <= 0:
                raise ValueError("Cannot sell entire portfolio")
                
            weight = sell_value / new_value
            return current_returns * (self.portfolio_value / new_value) - stock_returns * weight

    def _transaction(self, stock: str, amount: float, is_buy: bool):
        """Execute a buy/sell transaction"""
        if amount <= 0:
            raise ValueError("Transaction amount must be positive")
            
        if is_buy:
            self.portfolio_value += amount
            new_weights = {s: w * (self.portfolio_value - amount) / self.portfolio_value 
                          for s, w in self.portfolio_weights.items()}
            new_weights[stock] = new_weights.get(stock, 0) + amount / self.portfolio_value
        else:
            if stock not in self.portfolio_weights:
                raise ValueError(f"Cannot sell {stock} - not in portfolio")
                
            max_sell = self.portfolio_weights[stock] * self.portfolio_value
            amount = min(amount, max_sell)
            self.portfolio_value -= amount
            if self.portfolio_value <= 0:
                raise ValueError("Portfolio value cannot be zero or negative")
                
            new_weights = {s: w * (self.portfolio_value + amount) / self.portfolio_value 
                          for s, w in self.portfolio_weights.items() 
                          if s != stock}
            remaining = (self.portfolio_weights[stock] * (self.portfolio_value + amount) - amount) 
            if remaining > 0:
                new_weights[stock] = remaining / self.portfolio_value
                
        self.portfolio_weights = {s: w for s, w in new_weights.items() if w > 0}
        self.rolling_returns = self._calculate_updated_returns(stock, amount, is_buy)
        self._normalize_weights()

    def buy_stock(self, stock: str, amount: float):
        """Execute buy transaction"""
        self._transaction(stock, amount, is_buy=True)

    def sell_stock(self, stock: str, amount: float):
        """Execute sell transaction"""
        self._transaction(stock, amount, is_buy=False)

    def _normalize_weights(self):
        """Ensure weights sum to 1 with numerical stability"""
        total = sum(self.portfolio_weights.values())
        if abs(total - 1.0) > 1e-6:
            self.portfolio_weights = {s: w/total for s, w in self.portfolio_weights.items()}

    def rank_stocks(self, amount: float, is_buy: bool, max_recommendations: int = 5) -> List[Tuple[str, float]]:
        """
        Rank stocks by Sharpe ratio improvement
        Args:
            amount: Transaction amount
            is_buy: True for buy recommendations, False for sell
            max_recommendations: Number of recommendations to return
        """
        current_sharpe = self.calculate_sharpe_ratio()
        candidates = self.stocks if is_buy else list(self.portfolio_weights.keys())
        
        rankings = []
        for stock in candidates:
            try:
                hypothetical_returns = self._calculate_updated_returns(stock, amount, is_buy)
                new_sharpe = self.calculate_sharpe_ratio(hypothetical_returns)
                improvement = new_sharpe - current_sharpe
                rankings.append((stock, improvement))
            except Exception as e:
                continue  # Skip invalid candidates
                
        # Filter and sort candidates
        sorted_stocks = sorted(
            [x for x in rankings if x[1] > 0], 
            key=lambda x: x[1], 
            reverse=True
        )
        return sorted_stocks[:max_recommendations]

    def get_buy_recommendations(self, amount: float, max_recommendations: int = 5) -> List[Tuple[str, float]]:
        """Get ranked list of buy recommendations"""
        return self.rank_stocks(amount, True, max_recommendations)

    def get_sell_recommendations(self, amount: float, max_recommendations: int = 5) -> List[Tuple[str, float]]:
        """Get ranked list of sell recommendations"""
        return self.rank_stocks(amount, False, max_recommendations)

    def portfolio_summary(self) -> Dict:
        """Return current portfolio state"""
        return {
            "value": self.portfolio_value,
            "weights": self.portfolio_weights,
            "sharpe_ratio": self.calculate_sharpe_ratio(),
            "num_positions": len(self.portfolio_weights)
        }