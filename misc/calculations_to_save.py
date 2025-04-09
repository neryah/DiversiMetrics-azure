import pandas as pd
import numpy as np

# Load the adjusted close data (if not continuing from above)
adj_close = pd.read_csv("historical_adjusted_prices.csv", index_col='Date', parse_dates=True)

# Calculate daily returns for each stock (percentage change from previous day)
daily_returns = adj_close.pct_change().dropna()  # dropna to remove the first day NaN

# Compute **full-period expected return** (mean of daily returns) and **volatility** (std deviation)
expected_return = daily_returns.mean() * 252  # Convert daily mean return to annualized return
volatility = daily_returns.std() * np.sqrt(252)  # Convert daily std deviation to annualized volatility

# Create a summary DataFrame
metrics = pd.DataFrame({
    "Expected Return (annualized)": expected_return * 100,  # Convert to percentage
    "Volatility (annualized)": volatility * 100            # Convert to percentage
})

print("Full-period Expected Return and Volatility (%) for each stock:")
print(metrics.round(2))

# Save the results to CSV
metrics.to_csv("full_period_metrics.csv")

print("\nSaved full-period expected return & volatility to 'full_period_metrics.csv'.")

# let's check each stock's expected return - if the numbers doesn't make sense, we can check the data
# let decide of a threshold for the expected return and print the stocks that are above it with thier expected return in one list:
threshold = 0.2
print(f"\nStocks with Expected Return above {threshold * 100}%:")
problematic_stocks = metrics[metrics["Expected Return (annualized)"] > threshold * 100].index.tolist()
problematic_stocks = [f"{stock}: {metrics.loc[stock, 'Expected Return (annualized)']:.2f}%" for stock in problematic_stocks]
print(problematic_stocks)
# spy expected return:
print(f"\nExpected Return for GLD: {metrics.loc['GLD', 'Expected Return (annualized)']:.2f}%")
