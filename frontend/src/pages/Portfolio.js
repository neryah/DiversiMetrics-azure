import React, { useState, useEffect } from 'react';
import { Stock } from '@/entities/Stock';
import { InvokeLLM } from '@/integrations/Core';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, AlertCircle, FileText, DollarSign, TrendingUp, TrendingDown, HelpCircle, ImportIcon, Edit, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigate } from 'react-router-dom';

export default function Portfolio() {
  const { user, logout } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState({});
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [editStockOpen, setEditStockOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [textImport, setTextImport] = useState('');
  const [manualPrices, setManualPrices] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('buy');
  const [transactionStock, setTransactionStock] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionPrice, setTransactionPrice] = useState('');

  const [newStock, setNewStock] = useState({
    symbol: '',
    amount: '',
    purchase_price: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    is_bond: false,
    current_price: '',
    userId: user?.id
  });

  useEffect(() => {
    if (user) {
      loadStocks();
      setNewStock(prev => ({ ...prev, userId: user.id }));
    }
  }, [user]);

  useEffect(() => {
    if (stocks.length > 0 && !manualPrices) {
      fetchMarketData();
    }
  }, [stocks, manualPrices]);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const data = await Stock.list();
      setStocks(data);
    } catch (err) {
      console.error("Error loading stocks:", err);
      setError("Error loading your portfolio. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async (forceRefresh = false) => {
    if (manualPrices && !forceRefresh) return;
    
    const symbols = stocks
      .filter(stock => !stock.is_bond && !stock.current_price)
      .map(stock => stock.symbol)
      .join(',');
      
    if (!symbols) return;
    
    setMarketDataLoading(true);
    try {
      const result = await InvokeLLM({
        prompt: `
          Get the most accurate and up-to-date prices for these stock symbols: ${symbols}
          
          For each symbol return:
          1. The current market price per share
          2. The daily percentage change
          
          Return only the structured data in JSON format with no explanations
        `,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            stocks: {
              type: "object",
              patternProperties: {
                ".*": {
                  type: "object",
                  properties: {
                    price: { type: "number" },
                    change_percent: { type: "number" }
                  }
                }
              }
            }
          }
        }
      });
      
      if (result && result.stocks) {
        setMarketData(result.stocks);
        if (forceRefresh) {
          setError(null);
        }
      }
    } catch (err) {
      console.error("Error fetching market data:", err);
      if (forceRefresh) {
        setError("Could not refresh market data. Please try again later.");
      }
    } finally {
      setMarketDataLoading(false);
    }
  };

  const handleTransaction = async () => {
    if (!transactionAmount || !transactionPrice) {
      setError("Please fill in all transaction fields");
      return;
    }

    const amount = Number(transactionAmount);
    const price = Number(transactionPrice);
    
    if (amount <= 0 || price <= 0) {
      setError("Amount and price must be positive numbers");
      return;
    }

    try {
      const currentStock = stocks.find(s => s.id === transactionStock.id);
      let updatedStock;

      if (transactionType === 'buy') {
        const newTotalAmount = currentStock.amount + amount;
        const newAveragePrice = 
          ((currentStock.amount * currentStock.purchase_price) + (amount * price)) / newTotalAmount;

        updatedStock = {
          ...currentStock,
          amount: newTotalAmount,
          purchase_price: newAveragePrice
        };
      } else { // Sell
        if (currentStock.amount < amount) {
          setError(`You only own ${currentStock.amount} shares to sell`);
          return;
        }
        
        const newAmount = currentStock.amount - amount;
        updatedStock = {
          ...currentStock,
          amount: newAmount
        };

        if (newAmount === 0) {
          await Stock.delete(currentStock.id);
        }
      }

      if (updatedStock.amount > 0) {
        await Stock.update(currentStock.id, updatedStock);
      }

      await loadStocks();
      setTransactionOpen(false);
      setTransactionAmount('');
      setTransactionPrice('');
      setError(null);
    } catch (err) {
      setError("Error processing transaction. Please try again.");
    }
  };

  const openTransactionDialog = (stock, type) => {
    setTransactionStock(stock);
    setTransactionType(type);
    setTransactionOpen(true);
  };

  const openEditStock = (stock) => {
    setEditingStock({...stock});
    setEditStockOpen(true);
  };

  const updateStock = async () => {
    if (!editingStock.symbol || editingStock.amount === '' || editingStock.purchase_price === '') {
      setError("Please fill in all required fields");
      return;
    }
    
    try {
      await Stock.update(editingStock.id, {
        ...editingStock,
        symbol: editingStock.symbol.trim(),
        amount: Number(editingStock.amount),
        purchase_price: Number(editingStock.purchase_price),
        current_price: editingStock.current_price ? Number(editingStock.current_price) : null
      });
      await loadStocks();
      setEditStockOpen(false);
      setEditingStock(null);
    } catch (err) {
      setError("Error updating stock. Please try again.");
    }
  };

  const removeStock = async (stockId) => {
    try {
      await Stock.delete(stockId);
      await loadStocks();
    } catch (err) {
      setError("Error removing stock. Please try again.");
    }
  };

  const calculateTotalValue = (stock) => {
    const currentPrice = 
      stock.current_price ? Number(stock.current_price) :
      (!stock.is_bond && marketData[stock.symbol]?.price) ? 
        Number(marketData[stock.symbol].price) : 
        Number(stock.purchase_price);
        
    return stock.amount * currentPrice;
  };

  const calculateTotalGain = () => {
    return stocks.reduce((total, stock) => {
      const currentValue = calculateTotalValue(stock);
      const purchaseValue = stock.amount * Number(stock.purchase_price);
      return total + (currentValue - purchaseValue);
    }, 0);
  };

  const renderRowActions = (stock) => (
    <div className="flex justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openTransactionDialog(stock, 'buy')}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <TrendingUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openTransactionDialog(stock, 'sell')}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <TrendingDown className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openEditStock(stock)}
        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeStock(stock.id)}
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  const TransactionDialog = () => (
    <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transactionType === 'buy' ? 'Buy Shares' : 'Sell Shares'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {error && <Alert variant="destructive">{error}</Alert>}
          
          <div>
            <Label>Number of Shares</Label>
            <Input
              type="number"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              min="1"
              step="1"
            />
          </div>
          
          <div>
            <Label>Price per Share</Label>
            <Input
              type="number"
              step="0.0001"
              value={transactionPrice}
              onChange={(e) => setTransactionPrice(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleTransaction}
            className="w-full"
          >
            {transactionType === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderStockRow = (stock) => {
    const currentPrice = 
      stock.current_price ? Number(stock.current_price) :
      (!stock.is_bond && marketData[stock.symbol]?.price) ? 
        Number(marketData[stock.symbol].price) : 
        Number(stock.purchase_price);
      
    const changePercent = !stock.is_bond && marketData[stock.symbol]?.change_percent 
      ? Number(marketData[stock.symbol].change_percent) 
      : 0;
    
    const purchasePrice = Number(stock.purchase_price);
    const totalValue = stock.amount * currentPrice;
    const gainLoss = totalValue - (stock.amount * purchasePrice);
    const gainLossPercent = ((currentPrice / purchasePrice - 1) * 100);

    return (
      <tr key={stock.id} className="border-b hover:bg-gray-50">
        <td className="p-4">
          <span className="font-medium">{stock.symbol}</span>
        </td>
        <td className="p-4">
          {stock.is_bond ? (
            <Badge className="bg-purple-100 text-purple-800">Bond</Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800">Stock</Badge>
          )}
        </td>
        <td className="p-4 text-right">{stock.amount.toLocaleString()}</td>
        <td className="p-4 text-right">${purchasePrice.toFixed(4)}</td>
        <td className="p-4 text-right">
          <div className="flex items-center justify-end gap-2">
            ${currentPrice.toFixed(4)}
            {!stock.is_bond && !stock.current_price && !manualPrices && (
              <Badge variant="outline" className={changePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </Badge>
            )}
            {(stock.current_price || manualPrices) && (
              <span className="text-xs text-gray-500">(manual)</span>
            )}
          </div>
        </td>
        <td className="p-4 text-right font-medium">${totalValue.toFixed(2)}</td>
        <td className={`p-4 text-right font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${gainLoss.toFixed(2)}
          <span className="block text-xs">
            ({gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
          </span>
        </td>
        <td className="p-4">
          {renderRowActions(stock)}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Tracker</h1>
            <p className="text-gray-600">Track and manage your stock investments</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none">
                  <Plus className="w-4 h-4 mr-2" /> Add Security
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Security</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="is-bond" 
                      checked={newStock.is_bond}
                      onCheckedChange={(checked) => setNewStock({...newStock, is_bond: checked})}
                    />
                    <Label htmlFor="is-bond">This is a bond or fixed-income security</Label>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Symbol/ID</label>
                    <Input
                      value={newStock.symbol}
                      onChange={(e) => setNewStock({...newStock, symbol: e.target.value})}
                      placeholder={newStock.is_bond ? "e.g. 912810RL4" : "e.g. AAPL"}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Amount (Number of shares/units)</label>
                    <Input
                      type="number"
                      value={newStock.amount}
                      onChange={(e) => setNewStock({...newStock, amount: e.target.value})}
                      placeholder="Number of shares or units"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Purchase Price (per share/unit)</label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={newStock.purchase_price}
                      onChange={(e) => setNewStock({...newStock, purchase_price: e.target.value})}
                      placeholder="Price per share/unit"
                    />
                    {newStock.is_bond && (
                      <p className="text-xs text-gray-500 mt-1">
                        For a bond worth $2,004.98 for 2000 units, enter 1.00249
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Current Price (Optional)</label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={newStock.current_price}
                      onChange={(e) => setNewStock({...newStock, current_price: e.target.value})}
                      placeholder="Leave empty to use market data"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Override market data with your own price
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Purchase Date</label>
                    <Input
                      type="date"
                      value={newStock.purchase_date}
                      onChange={(e) => setNewStock({...newStock, purchase_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      value={newStock.notes}
                      onChange={(e) => setNewStock({...newStock, notes: e.target.value})}
                      placeholder="Optional notes"
                    />
                  </div>
                  <Button onClick={addStock} className="w-full">Add Security</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 md:flex-none">
                  <ImportIcon className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Import Portfolio Data</DialogTitle>
                </DialogHeader>
                
                <div className="mt-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Copy and paste your portfolio data from your broker. 
                      We support both Hebrew and English formats.
                    </p>
                  </div>
                  
                  <Textarea 
                    value={textImport}
                    onChange={(e) => setTextImport(e.target.value)}
                    placeholder="Paste your portfolio data here..."
                    className="min-h-[200px] mb-4"
                  />
                  
                  <div className="bg-blue-50 p-4 rounded-md mb-4">
                    <h3 className="text-sm font-medium text-blue-800">Examples of supported formats:</h3>
                    <div className="text-xs text-blue-700 mt-2 space-y-2">
                      <p><strong>English:</strong> AAPL 50 shares at $150</p>
                      <p><strong>Bonds:</strong> 2000 of 912810RL4 worth $2,004.98</p>
                      <p><strong>Hebrew:</strong> נייר: אפל, כמות: 50, שער אחרון: 150</p>
                      <p><strong>CSV style:</strong> Symbol,Amount,Price<br/>AAPL,50,150<br/>MSFT,25,300</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setImportDialogOpen(false)}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={processTextImport}
                      disabled={processing || !textImport.trim()}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Import Data'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => fetchMarketData(true)}
              disabled={marketDataLoading || manualPrices}
              className={`flex-none ${marketDataLoading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-2 ml-2">
              <Switch
                id="manual-mode"
                checked={manualPrices}
                onCheckedChange={setManualPrices}
              />
              <Label htmlFor="manual-mode" className="text-sm">Manual prices</Label>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-none">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Click "Edit" on any security to modify symbol, amount, or price</p>
                  <p className="mt-1">For bonds, use "per unit" price (total value ÷ units)</p>
                  <p className="mt-1">Example: If 2000 units of a bond are worth $2,004.98, the price is $1.00249 per unit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Positions</p>
                <p className="text-2xl font-bold">{stocks.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Portfolio Value</p>
                <p className="text-2xl font-bold">
                  ${stocks.reduce((sum, stock) => sum + calculateTotalValue(stock), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${calculateTotalGain() >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {calculateTotalGain() >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${calculateTotalGain() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${calculateTotalGain().toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <TransactionDialog />
        
        <div className="bg-white rounded-xl shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Symbol</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-right p-4">Shares/Units</th>
                  <th className="text-right p-4">Purchase Price</th>
                  <th className="text-right p-4">Current Price</th>
                  <th className="text-right p-4">Total Value</th>
                  <th className="text-right p-4">Gain/Loss</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-4 text-gray-500">
                      No securities in portfolio. Add securities or import your data.
                    </td>
                  </tr>
                ) : (
                  stocks.map(renderStockRow)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}