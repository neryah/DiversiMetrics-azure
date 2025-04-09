import pandas as pd
import numpy as np


class PortfolioManager:
    def __init__(self, initial_stocks, initial_weights, historical_data, risk_free_rate=0.045):
        """
        Initialize the portfolio with given stocks and weights.
        :param initial_stocks: List of initial stock tickers
        :param initial_weights: List of corresponding investment amounts
        :param historical_csv_path: Path to CSV file containing historical adjusted close prices
        :param metrics_csv_path: Path to CSV file containing precomputed expected return and volatility####For debugging
        :param risk_free_rate: Risk-free rate for Sharpe ratio calculation
        """
        assert len(initial_stocks) == len(initial_weights), f"Stocks and weights must have the same length! Got {len(initial_stocks)} stocks and {len(initial_weights)} weights."
        self.historical_data = historical_data
        self.stocks = self.historical_data.columns.tolist()
        

        self.sharpe_penalization = 1
        
        
        self.portfolio_value = sum(initial_weights)
        # if stocks art initial_weights don't exist - print them and delete them from the list
        non_existing_stocks = [stock for stock in initial_stocks if stock not in self.stocks]
        if non_existing_stocks:
            print("Non existing stocks:", non_existing_stocks)
            for stock in non_existing_stocks:
                initial_weights.remove(initial_weights[initial_stocks.index(stock)])
                initial_stocks.remove(stock)
                
        self.portfolio_weights = {
            stock: weight / self.portfolio_value for stock, weight in zip(initial_stocks, initial_weights)
        }
        
        # ### for debugging/prints:
        # metrics = pd.read_csv(metrics_csv_path, index_col=0)
        # self.expected_return = metrics["Expected Return (annualized)"] / 100
        # self.volatility = metrics["Volatility (annualized)"] / 100
        # ###

        
        self.risk_free_rate = risk_free_rate
        self.rolling_returns = []  # ±2520 to store last 10 years of daily portfolio returns
        self.update_rolling_returns()
        
        # self.diagnose_data("After Rolling Returns Creation")
        # print std and return for portfolio:
        # print("Portfolio return:", self.calculate_portfolio_returns().mean() * 252)
        # print("Portfolio std:", self.calculate_portfolio_returns().std() * np.sqrt(252))

    def diagnose_data(self, stage="Initial Load"):
        """Diagnose potential issues in historical data."""
        print(f"📌 Diagnosing historical data... ({stage})")

        # ✅ Check if all stocks have the same number of records
        record_lengths = self.historical_data.count()
        min_records = record_lengths.min()
        max_records = record_lengths.max()

        if min_records != max_records:
            print(f"⚠️ Warning: Not all stocks have the same number of records.")
            print(record_lengths)

        # ✅ Check for misalignment in dates
        missing_dates = self.historical_data.isnull().sum()
        if missing_dates.sum() > 0:
            print(f"⚠️ Warning: Some stocks have missing dates. Forward-filling missing values.")
            self.historical_data.ffill(inplace=True)

        # ✅ Ensure date index is strictly increasing
        if not self.historical_data.index.is_monotonic_increasing:
            print("⚠️ Warning: Date index is not sorted. Sorting now...")
            self.historical_data.sort_index(inplace=True)

        # ✅ Check if `self.rolling_returns` exists and has valid data
        if stage == "After Rolling Returns Creation":
            print(f"📌 Diagnosing `self.rolling_returns`...")
            print(f"Rolling vector length: {len(self.rolling_returns)}")
            # print other stocks' length:
            print(f"Stocks length: {len(self.historical_data)}")
            print(f"First few values: {self.rolling_returns[:5]}")

            if len(self.rolling_returns) == 0:
                print("❌ ERROR: `self.rolling_returns` is empty!")

            if any(pd.isna(self.rolling_returns)):
                print("❌ ERROR: `self.rolling_returns` contains NaN values!")
                
        self.calculate_portfolio_returns()

        print("✅ Data diagnosis complete.")
    
    def update_rolling_returns(self):
        """Store the full history of portfolio returns, ensuring alignment with historical data."""
        stock_returns = self.historical_data.pct_change().dropna()

        if len(stock_returns) > len(self.historical_data):
            stock_returns = stock_returns.iloc[-len(self.historical_data):]  # Trim stock_returns if needed

        self.rolling_returns = stock_returns[list(self.portfolio_weights.keys())].dot(
            np.array(list(self.portfolio_weights.values()))
        ).tolist()
    
    def get_portfolio_return(self):
        """Return the current rolling portfolio return series."""
        return self.portfolio_expected_return
    
    def calculate_portfolio_returns(self):
        """Return the current rolling portfolio return series."""
        return pd.Series(self.rolling_returns)
    
    def calculate_sharpe_ratio(self):
        """Compute the Sharpe ratio using the rolling returns."""

        # Ensure rolling_returns is clean
        returns = pd.Series(self.rolling_returns).dropna().tolist()

        # Correct expected return calculation
        expected_return = np.mean(returns) * 252  # Annualized return

        # Correct standard deviation calculation
        portfolio_std = np.std(returns) * np.sqrt(252)  # Annualized volatility

        # # Print for debugging
        # print("Expected Return:", expected_return)
        # print("Portfolio Std:", portfolio_std)
        # return portfolio_std
        return (expected_return - self.risk_free_rate) / (portfolio_std ** self.sharpe_penalization) if portfolio_std > 0 else 0
    
    def get_updates_for_buy_version2(self, stock, buy_amount):
        """Return the updated portfolio standard deviation if a stock is bought."""
        stock_return = self.expected_return[stock]
        stock_std = self.volatility[stock]
        correlation = self.historical_data[stock].pct_change().corr(self.calculate_portfolio_returns())

        new_weight = buy_amount / (self.portfolio_value + buy_amount)
        expected_new_std = np.sqrt(
            (1 - new_weight) ** 2 * self.portfolio_volatility ** 2 +
            new_weight ** 2 * stock_std ** 2 +
            2 * (1 - new_weight) * new_weight * self.portfolio_volatility * stock_std * correlation
        )
        return expected_new_std, (1 - new_weight) * self.portfolio_expected_return + new_weight * stock_return

    
    def get_updates_for_buy(self, stock, buy_amount):
        """Return the updated portfolio standard deviation, expectation if a stock is bought."""
        
        # Drop NaN values from pct_change()
        stock_vector = np.array(self.historical_data[stock].pct_change().dropna())

        new_weight = buy_amount / (self.portfolio_value + buy_amount)

        # Compute updated portfolio vector
        updated_portfolio_vector = np.array(self.rolling_returns) * (1 - new_weight) + stock_vector * new_weight


        expected_new_return = updated_portfolio_vector.mean() * 252
        expected_new_std = updated_portfolio_vector.std() * np.sqrt(252)

        assert not np.isnan(expected_new_return) and not np.isnan(expected_new_std), "NaN values detected!"

        return expected_new_std, expected_new_return
    
    def get_updates_for_sell_old(self, stock, sell_amount):
        """Return the updated portfolio standard deviation, expectation if a stock is sold."""
        stock_vector = np.array(self.historical_data[stock].pct_change().dropna())
        stock_weight = sell_amount / self.portfolio_value
        
        updated_portfolio_vector = self.calculate_portfolio_returns() - stock_vector * stock_weight
        expected_new_return = updated_portfolio_vector.mean() * 252
        expected_new_std = updated_portfolio_vector.std() * np.sqrt(252)
        
        return expected_new_std, expected_new_return
    
    def get_updates_for_sell(self, stock, sell_amount):
        """Return the updated portfolio standard deviation, expectation if a stock is sold."""
        stock_vector = np.array(self.historical_data[stock].pct_change().dropna())
        V_new = self.portfolio_value - sell_amount   
                     
        updated_portfolio_vector = np.array(self.rolling_returns) * (self.portfolio_value / V_new) - stock_vector * (sell_amount / V_new)
        
        expected_new_return = updated_portfolio_vector.mean() * 252
        expected_new_std = updated_portfolio_vector.std() * np.sqrt(252)
        
        return expected_new_std, expected_new_return
    
    def buy_stock(self, stock, buy_amount):
        """Buy a stock, increasing portfolio value and updating weights."""
        if stock not in self.stocks:
            return  # Skip stocks without data
        
        V_old = self.portfolio_value
        self.portfolio_value = V_old + buy_amount
        
        for s in self.portfolio_weights:
            self.portfolio_weights[s] *= (V_old / self.portfolio_value)
        
        if stock in self.portfolio_weights:
            self.portfolio_weights[stock] += buy_amount / self.portfolio_value
        else:
            self.portfolio_weights[stock] = buy_amount / self.portfolio_value
        
        # self.update_rolling_returns()
        stock_vector = np.array(self.historical_data[stock].pct_change().dropna())  
        #current_vec = stock_vector*buy_amount/V_old + future_vector*V_new/V_old
        #current_vec*V_old = stock_vector*buy_amount + future_vector*V_new
        #future_vector*V_new = current_vec*V_old - stock_vector*buy_amount
        #future_vector = (current_vec*V_old - stock_vector*buy_amount)/V_new
        self.rolling_returns = np.array(self.rolling_returns) * (V_old / self.portfolio_value) + stock_vector * (buy_amount / self.portfolio_value)

        
    
    def sell_stock(self, stock, sell_amount):
        """Sell a stock, decreasing portfolio value and updating weights."""
        if stock not in self.portfolio_weights:
            print("sell_stock::Stock not in portfolio")
            return  # Skip if stock is not in portfolio
        
        stock_value = self.portfolio_weights[stock] * self.portfolio_value
        if sell_amount > stock_value:
            print("sell_stock::Stock not in portfolio")
            return  # Skip if trying to sell more than available
        
        V_old = self.portfolio_value
        V_new = V_old - sell_amount
        
        
        
        for s in self.portfolio_weights:
            if s != stock:
                self.portfolio_weights[s] *= (V_old / V_new)
        
        remaining_stock_value = stock_value - sell_amount
        if remaining_stock_value > 0:
            self.portfolio_weights[stock] = remaining_stock_value / V_new
        else:
            del self.portfolio_weights[stock]
        
        
        self.portfolio_value = V_new
        
        #current_vec = stock_vector*sell_amount/V_old + future_vec*V_new/V_old
        #current_vec*V_old = stock_vector*sell_amount + future_vec*V_new
        #future_vec*V_new = current_vec*V_old - stock_vector*sell_amount
        #future_vec = (current_vec*V_old - stock_vector*sell_amount)/V_new
        
        # self.update_rolling_returns()
        stock_vector = np.array(self.historical_data[stock].pct_change().dropna())
        self.rolling_returns = np.array(self.rolling_returns) * (V_old / V_new) - stock_vector * (sell_amount / V_new)
        
        
    
    def rank_stocks_for_buying(self, buy_amount):
        """Rank stocks by improvement in Sharpe ratio if bought."""
        ranking = []

        for stock in self.stocks:
            if stock in self.portfolio_weights and self.portfolio_weights[stock] > 0.06:
                continue  # Skip if stock is already overweighted

            expected_new_std, expected_new_return = self.get_updates_for_buy(stock, buy_amount)
            sharpe = (expected_new_return - self.risk_free_rate) / (expected_new_std ** self.sharpe_penalization)

            ranking.append((stock, sharpe, expected_new_return, expected_new_std))

        # Sort by Sharpe improvement (descending)
        return sorted(ranking, key=lambda x: x[1], reverse=True)[:5]
    
    def rank_stocks_for_sell(self, sell_amount):
        """Rank stocks by improvement in Sharpe ratio if sold."""
        ranking = []

        for stock in self.portfolio_weights:
            stock_weight = self.portfolio_weights[stock]
            if sell_amount > stock_weight * self.portfolio_value:
                continue

            expected_new_std, expected_new_return = self.get_updates_for_sell(stock, sell_amount)
            if expected_new_std <= 0:
                continue

            sharpe = (expected_new_return - self.risk_free_rate) / (expected_new_std ** self.sharpe_penalization)
            ranking.append((stock, sharpe, expected_new_return, expected_new_std))

        return sorted(ranking, key=lambda x: x[1], reverse=True)[:5]


    def normalize_weights(self):
        """Ensure portfolio weights sum exactly to 1 after rounding dollar values to integers."""
        
        # Step 1: Convert weights to dollar amounts
        portfolio_amounts = {stock: round(weight * self.portfolio_value) for stock, weight in self.portfolio_weights.items()}

        # Step 2: Remove any stocks that have been rounded to 0
        portfolio_amounts = {stock: amt for stock, amt in portfolio_amounts.items() if amt > 0}

        # Step 3: Recalculate the new total portfolio value
        new_portfolio_value = sum(portfolio_amounts.values())

        # Step 4: Recalculate weights from the rounded amounts
        self.portfolio_weights = {stock: amt / new_portfolio_value for stock, amt in portfolio_amounts.items()}
        self.portfolio_value = new_portfolio_value  # Update total portfolio value

        # Step 5: Assert weights sum exactly to 1
        total_weight = sum(self.portfolio_weights.values())
        assert abs(total_weight - 1.0) < 1e-10, f"Total weight is not 1: {total_weight}"
        
        print("✅ Portfolio weights normalized successfully!")
        
    def get_buy_recommendations(self, budget):
        expected_new_return = np.array(self.rolling_returns).mean() * 252
        expected_new_std = np.array(self.rolling_returns).std() * np.sqrt(252)
        current_sharpe = (expected_new_return - self.risk_free_rate) / (expected_new_std ** self.sharpe_penalization)

        top = self.rank_stocks_for_buying(budget)
        if not top:
            return {
                "current": {
                    "return": expected_new_return,
                    "std": expected_new_std,
                    "risk-reward": current_sharpe
                },
                "top": [],
                "recommendation": None
            }

        best_ticker, best_sharpe, best_return, best_std = top[0]
        sharpe_diff = best_sharpe - current_sharpe
        return_diff = best_return - expected_new_return
        std_diff = expected_new_std - best_std

        return {
            "current": {
                "return": expected_new_return,
                "std": expected_new_std,
                "risk-reward": current_sharpe
            },
            "top": [
                {
                    "ticker": ticker,
                    "risk-reward": sharpe,
                    "expected_return": ret,
                    "expected_std": std
                }
                for ticker, sharpe, ret, std in top
            ],
            "recommendation": {
                "action": "buy",
                "ticker": best_ticker,
                "risk-reward_diff": sharpe_diff,
                "return_diff": return_diff,
                "std_diff": std_diff,
                "amount": budget
            }
        }


    def get_sell_recommendations(self, budget):
        expected_new_return = np.array(self.rolling_returns).mean() * 252
        expected_new_std = np.array(self.rolling_returns).std() * np.sqrt(252)
        current_sharpe = (expected_new_return - self.risk_free_rate) / (expected_new_std ** self.sharpe_penalization)

        top = self.rank_stocks_for_sell(budget)
        if not top:
            return {
                "current": {
                    "return": expected_new_return,
                    "std": expected_new_std,
                    "risk-reward": current_sharpe
                },
                "top": [],
                "recommendation": None
            }

        best_ticker, best_sharpe, best_return, best_std = top[0]
        sharpe_diff = best_sharpe - current_sharpe
        return_diff = best_return - expected_new_return
        std_diff = expected_new_std - best_std

        return {
            "current": {
                "return": expected_new_return,
                "std": expected_new_std,
                "risk-reward": current_sharpe
            },
            "top": [
                {
                    "ticker": ticker,
                    "risk-reward": sharpe,
                    "expected_return": ret,
                    "expected_std": std
                }
                for ticker, sharpe, ret, std in top
            ],
            "recommendation": {
                "action": "sell",
                "ticker": best_ticker,
                "risk-reward_diff": sharpe_diff,
                "return_diff": return_diff,
                "std_diff": std_diff,
                "amount": budget
            }
        }
