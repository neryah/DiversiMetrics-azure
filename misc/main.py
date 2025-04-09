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

for i in range(100):
    
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
    print("Current Sharpe Ratio (after buy):", buy_sharpe_ratio)
    

    # Call to sell with 15k and print nicely the current sharpe (after the buy) ratio and the output-dict's content.
    optional_sells = portfolio.rank_stocks_for_sell(amount)
    best_to_sell = optional_sells[0]
    print("Best to sell:", best_to_sell)
    portfolio.sell_stock(best_to_sell[0], amount)
    sell_sharpe_ratio = portfolio.calculate_sharpe_ratio()
    if best_to_buy[0] == best_to_sell[0]:
        print("Got convergence at iteration:", i)
        print("Current Sharpe Ratio:", sell_sharpe_ratio)
        portfolio.normalize_weights()
        portfolio_amounts = {stock: weight * portfolio.portfolio_value for stock, weight in portfolio.portfolio_weights.items()}
        print("Portfolio amounts:")
        print(portfolio_amounts)
        # for stock, amount in portfolio_amounts.items():
        #     print(stock, amount, portfolio.expected_return[stock], portfolio.volatility[stock])
        
        print("portfolio value:", portfolio.portfolio_value)
        
        print(sum(portfolio.portfolio_weights.values()))
        
        break

    
    
    sharpe_ration_graph.append(sell_sharpe_ratio)
    improved_by_selling.append(sell_sharpe_ratio - current_sharpe_ratio)
    current_sharpe_ratio = sell_sharpe_ratio
    print("Current Sharpe Ratio (after sell):", sell_sharpe_ratio)
    
#graph:
sharpe_ration_graph = pd.Series(sharpe_ration_graph)
sharpe_ration_graph.plot(title="Sharpe Ratio over time", xlabel="Trade number", ylabel="Sharpe Ratio")
import matplotlib.pyplot as plt
plt.show()
# improved graphs:
improved_by_buying = pd.Series(improved_by_buying)
improved_by_buying.plot(title="Improvement by buying", xlabel="Trade number", ylabel="Improvement in Sharpe Ratio")
plt.show()
improved_by_selling = pd.Series(improved_by_selling)
improved_by_selling.plot(title="Improvement by selling", xlabel="Trade number", ylabel="Improvement in Sharpe Ratio")
plt.show()

