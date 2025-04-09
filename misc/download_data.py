import pandas as pd
import yfinance as yf


# Define the list of stock tickers

tickers = ['0001.HK', '0002.HK', '0003.HK', '0005.HK', '0011.HK', '0012.HK', '0016.HK', '0017.HK', '0027.HK', '005930.KS', '0066.HK', '0175.HK', '0388.HK', '0700.HK', '0883.HK', '0939.HK', '1038.HK', '1109.HK', '1299.HK', '1398.HK', '2318.HK', '2388.HK', '2628.HK', '3988.HK', '6501.T', '6503.T', '6594.T', '6758.T', '6902.T', '7203.T', '7267.T', '7270.T', '7751.T', '8035.T', '8306.T', '8316.T', '8766.T', '9412.T', '9983.T', '9984.T', 'AAPL', 'ABBV', 'ABEV', 'ABI.BR', 'ABT', 'ACA.PA', 'ACN', 'ADBE', 'ADM', 'ADP', 'ADS.DE', 'ADSK', 'AEE', 'AEP', 'AES', 'AFL', 'AGI', 'AI.PA', 'AIG', 'AIR.PA', 'AIV', 'AJG', 'AKAM', 'ALB', 'ALC', 'ALL', 'ALLE', 'ALV.DE', 'AMAT', 'AMD', 'AMGN', 'AMP', 'AMT', 'AMX', 'AMZN', 'ANET', 'ANSS', 'ANTO.L', 'AON', 'APD', 'APH', 'ARE', 'ASH', 'ASIANPAINT.NS', 'ASML', 'AVB', 'AVGO', 'AXISBANK.NS', 'AXP', 'AZN.L', 'BA', 'BA.L', 'BAC', 'BAJFINANCE.NS', 'BARC.L', 'BAS.DE', 'BATS.L', 'BAX', 'BAYN.DE', 'BBD', 'BBY', 'BCE', 'BDX', 'BEI.DE', 'BEN', 'BF-B', 'BHARTIARTL.NS', 'BHB', 'BIIB', 'BK', 'BKNG', 'BLK', 'BMO', 'BMW.DE', 'BMY', 'BNP.PA', 'BNR.DE', 'BP.L', 'BR', 'BRK-B', 'BRO', 'BSX', 'BT-A.L', 'BUD', 'C', 'CA.PA', 'CAH', 'CALM', 'CARR', 'CAT', 'CB', 'CBK.DE', 'CBRE', 'CCI', 'CCL', 'CDNS', 'CDW', 'CE', 'CHD', 'CHRW', 'CI', 'CINF', 'CL', 'CLX', 'CMA', 'CMCSA', 'CME', 'CMI', 'CMS', 'CNR.TO', 'COF', 'CON.DE', 'COO', 'COP', 'COST', 'CPRT', 'CRM', 'CS.PA', 'CSCO', 'CSX', 'CTAS', 'CTSH', 'CTVA', 'CVS', 'CVX', 'CX', 'D', 'DAL', 'DB1.DE', 'DBK.DE', 'DD', 'DE', 'DELL', 'DFS', 'DG', 'DG.PA', 'DGE.L', 'DGX', 'DHI', 'DHR', 'DIS', 'DLR', 'DLTR', 'DOV', 'DRI', 'DSY.PA', 'DTE.DE', 'DTG.DE', 'DUK', 'DVN', 'EA', 'EBAY', 'ECL', 'ED', 'EFX', 'EIX', 'EL', 'EL.PA', 'EMN', 'EMR', 'ENB.TO', 'ENGI.PA', 'ENR.DE', 'EOAN.DE', 'EOG', 'EPAM', 'EPD', 'EQIX', 'EQT', 'ERIE', 'ES', 'ESS', 'ETN', 'ETR', 'EVRG', 'EW', 'EXC', 'EXPD', 'EXPE', 'EXPN.L', 'EXR', 'F', 'FAST', 'FCX', 'FDX', 'FE', 'FFIV', 'FIS', 'FITB', 'FLR', 'FMC', 'FME.DE', 'FMX', 'FNMA', 'FRE.DE', 'FRES.L', 'FRT', 'FTI', 'GD', 'GE', 'GEI.TO', 'GIS', 'GLEN.L', 'GLW', 'GM', 'GNRC', 'GOOG', 'GOOGL', 'GPC', 'GPN', 'GS', 'GSK.L', 'GWW', 'HAL', 'HAS', 'HBAN', 'HCLTECH.NS', 'HD', 'HDFCBANK.NS', 'HEI.DE', 'HEN3.DE', 'HES', 'HFG.DE', 'HIG', 'HII', 'HINDUNILVR.NS', 'HLT', 'HNR1.DE', 'HO.PA', 'HON', 'HPE', 'HPQ', 'HRL', 'HSBA.L', 'HSY', 'HUM', 'IAG.L', 'IBM', 'ICE', 'ICICIBANK.NS', 'IDXX', 'IEX', 'IFF', 'IFX.DE', 'IHG.L', 'ILMN', 'IMB.L', 'IMO.TO', 'INFY', 'INFY.NS', 'INTC', 'INTU', 'INVH', 'IP', 'IPG', 'IQV', 'ISRG', 'IT', 'ITC.NS', 'ITRK.L', 'ITUB', 'ITW', 'IVZ', 'JCI', 'JD', 'JNJ', 'JNPR', 'JPM', 'K', 'KDP', 'KEY', 'KEYS', 'KHC', 'KIM', 'KLAC', 'KMB', 'KNIN.SW', 'KO', 'KOTAKBANK.NS', 'KR', 'L', 'LAND.L', 'LHX', 'LIN', 'LLOY.L', 'LLY', 'LMT', 'LNC', 'LNVGY', 'LOW', 'LSEG.L', 'LT.NS', 'LUV', 'LYB', 'LYG', 'MA', 'MAN', 'MAR', 'MARUTI.NS', 'MAS', 'MC.PA', 'MCD', 'MCHP', 'MCO', 'MDLZ', 'MDT', 'MET', 'META', 'MFC', 'MGM', 'MHK', 'MKC', 'MKTX', 'ML.PA', 'MLM', 'MMM', 'MNST', 'MO', 'MOH', 'MPWR', 'MRK', 'MRK.DE', 'MRO.L', 'MS', 'MSCI', 'MSFT', 'MSI', 'MTB', 'MTD', 'MTX.DE', 'MU', 'MUV2.DE', 'NDAQ', 'NEE', 'NEM', 'NFLX', 'NG.L', 'NI', 'NKE', 'NOC', 'NOVN.SW', 'NOW', 'NPSNY', 'NRG', 'NSC', 'NTAP', 'NTRS', 'NUE', 'NVDA', 'NVS', 'NWG.L', 'NWL', 'NXT.L', 'O', 'ODFL', 'OKE', 'OMC', 'ON', 'OR.PA', 'ORCL', 'ORLY', 'ORLY.BA', 'OXY', 'PAYX', 'PBR', 'PCAR', 'PEG', 'PEP', 'PFE', 'PFG', 'PG', 'PH', 'PHM', 'PKG', 'PLD', 'PM', 'PNC', 'PNR', 'PNW', 'PPG', 'PPL', 'PRU', 'PRU.L', 'PSN.L', 'PSX', 'PUK', 'PVH', 'QCOM', 'QRVO', 'RCL', 'REG', 'RELIANCE.NS', 'RF', 'RHM.DE', 'RI.PA', 'RIO.L', 'RMS.PA', 'RNG', 'ROK', 'ROP', 'ROST', 'RR.L', 'RSG', 'RSW.L', 'RTX', 'RWE.DE', 'RY', 'SAF.PA', 'SAN.PA', 'SAP.DE', 'SBILIFE.NS', 'SBIN.NS', 'SBUX', 'SCHW', 'SEE', 'SGE.L', 'SGO.PA', 'SGRO.L', 'SHL.DE', 'SHW', 'SIE.DE', 'SJM', 'SLB', 'SNA', 'SNPS', 'SNX', 'SO', 'SPGI', 'SQ', 'SRE', 'SSL', 'SSNC', 'STJ.L', 'STT', 'STZ', 'SU.PA', 'SUNPHARMA.NS', 'SVT.L', 'SWK', 'SWKS', 'SY1.DE', 'SYK', 'SYY', 'T', 'TAP', 'TCS.NS', 'TD', 'TDG', 'TEL', 'TEVA', 'TGT', 'THG', 'TJX', 'TLW.L', 'TMO', 'TMUS', 'TPR', 'TRV', 'TSCO', 'TSCO.L', 'TSLA', 'TSM', 'TSN', 'TT', 'TTWO', 'TXN', 'TXT', 'TYL', 'UA', 'UAL', 'UDR', 'UHS', 'ULVR.L', 'UNH', 'UNP', 'UPS', 'USB', 'V', 'VALE', 'VFC', 'VLO', 'VNA.DE', 'VOD.L', 'VOLV-B.ST', 'VOW3.DE', 'VTR', 'VWAGY', 'VZ', 'WAB', 'WAT', 'WEC', 'WEIR.L', 'WELL', 'WFC', 'WHR', 'WM', 'WMB', 'WMT', 'WPP.L', 'WRB', 'WST', 'WTB.L', 'WTW', 'WYNN', 'XEL', 'XOM', 'XYL', 'YUM', 'ZAL.DE', 'ZBH', 'ZBRA', 'ZTS', '^IXIC',
    # Popular US ETFs (Broad Market & Sector):
    'SPY', 'IVV', 'VOO', 'QQQ', 'IWM', 'DIA', 'XLK', 'XLE', 'XLF', 'XLV', 'XLI', 'XLY', 'XLP', 'XLB', 'XLU', 'XLRE',

    # International ETFs:
    'VEA', 'VWO', 'EFA', 'EEM', 'IEFA', 'IEMG',

    # Bond ETFs:
    'AGG', 'BND', 'TLT', 'IEF',

    # Commodity ETFs:
    'GLD', 'SLV', 'USO',

    # Cryptocurrencies:
    'BTC-USD', 'ETH-USD',

    # Major Indices:
    '^GSPC', '^DJI'
    ]

# #duplicate tickers
tickers = list(set(tickers))

#suplicates:
to_remove = [x for x in tickers if tickers.count(x) > 1]

print(f"Downloading data for {len(tickers)} stocks...")

# Download 10 years of daily data for the tickers
data = yf.download(tickers, period="10y", auto_adjust=False)

# Extract Adjusted Close Prices
adj_close = data["Adj Close"]

# Create a full date range from the min to max date
full_date_range = pd.date_range(start=adj_close.index.min(), end=adj_close.index.max(), freq="B")

# Reindex the DataFrame to fill missing dates
adj_close = adj_close.reindex(full_date_range)

# Forward-fill missing prices to maintain continuity
adj_close.ffill(inplace=True)

# Optional: Back-fill missing values if necessary (for very recent IPOs)
adj_close.bfill(inplace=True)

# Define the minimum threshold for valid data points (e.g., 95% of total trading days)
min_valid_data_points = int(0.95 * len(adj_close))

# Identify valid and invalid stocks based on the threshold
valid_stocks = []
invalid_stocks = []

for stock in adj_close.columns:
    non_na_count = adj_close[stock].notna().sum()
    if non_na_count >= min_valid_data_points:
        valid_stocks.append(stock)
    else:
        invalid_stocks.append(stock)

# Print invalid stocks and the number of valid stocks
print(f"Invalid stocks (insufficient data): {invalid_stocks}")
print(f"Number of valid stocks: {len(valid_stocks)}")

# Optionally, filter the DataFrame to include only valid stocks
adj_close = adj_close[valid_stocks]

# Save the cleaned adjusted close prices to a CSV file
adj_close.index.name = "Date"  # Ensure the index is properly named
adj_close.to_csv("historical_adjusted_prices.csv", index=True)



print("Downloaded and cleaned data for columns:", adj_close.columns)
print(f"Number of records: {len(adj_close)} (should be the same for all valid stocks)")
