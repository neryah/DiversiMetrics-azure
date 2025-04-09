from backend.portfolio_manager import Portfolio as Portfolio_sharpe
import pandas as pd

# Initial stocks and weights
initial_stocks = ["AAPL", "MSFT", "GOOGL", "META", "BRK-B", "JPM", "BAC", "WFC", "C", "GS", "TSLA", "AMZN", "JNJ", "PFE", "MRK", "VZ", "T", "NFLX", "DIS"]
initial_weights = [15000, 15000, 30000, 40000, 15000, 15000, 30000, 40000, 15000, 15000, 30000, 40000, 15000, 15000, 30000, 15000, 15000, 30000, 40000]
# Sample historical adjusted close prices (from CSV)
portfolio = Portfolio_sharpe(initial_stocks, initial_weights)

# Main:
current_sharpe_ratio = portfolio.calculate_sharpe_ratio()
sharpe_ration_graph = [current_sharpe_ratio]
improved_by_buying = []
improved_by_selling = []
print("Current Sharpe Ratio:", sharpe_ration_graph[-1])

for i in range(300):
    
    # Call to buy with 5k
    amount = 5000
    optional_buys = portfolio.rank_stocks_for_buying(amount)
    best_to_buy = optional_buys[0]
    # print("Output Dictionary buy:", optional_buys)
    print("Best to buy:", best_to_buy)

    portfolio.buy_stock(best_to_buy[0], amount)
    buy_sharpe_ratio = portfolio.calculate_sharpe_ratio()
    improved_by_buying.append(buy_sharpe_ratio - current_sharpe_ratio)
    current_sharpe_ratio = buy_sharpe_ratio
    sharpe_ration_graph.append(buy_sharpe_ratio)
    print("Current Sharpe Ratio (after buy):", buy_sharpe_ratio)
    

    
#graph:
sharpe_ration_graph = pd.Series(sharpe_ration_graph)
sharpe_ration_graph.plot(title="Sharpe Ratio over time", xlabel="Trade number", ylabel="Sharpe Ratio")
import matplotlib.pyplot as plt
plt.show()
# improved graphs:
improved_by_buying = pd.Series(improved_by_buying)
improved_by_buying.plot(title="Improvement by buying", xlabel="Trade number", ylabel="Improvement in Sharpe Ratio")
plt.show()


