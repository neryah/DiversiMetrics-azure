import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stock } from '../Entities/Stock';
import { InvokeLLM } from "../integrations/Core";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { format } from "date-fns";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";

import {
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Edit,
  RefreshCw,
  ImportIcon,
} from "lucide-react";



function FloatingActions({ newStock, setNewStock, addStock, textImport, setTextImport, processTextImport, processing }) {
  const [openType, setOpenType] = useState(null); // "add" | "import" | null

  return (
    <>
      {/* Floating Buttons */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 z-50">
        <Button
          onClick={() => {
            setOpenType("add");
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Security
        </Button>
        <Button
          onClick={() => {
            setOpenType("import");
          }}
        >
          <ImportIcon className="w-4 h-4 mr-2" />
          Import Data
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={!!openType} onOpenChange={(v) => {
        if (!v) setOpenType(null);
      }}>
        <DialogContent className="max-w-lg w-[95vw] rounded-xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {openType === "add" ? "Add New Security" : "Import Portfolio Data"}
            </DialogTitle>
          </DialogHeader>

          {/* ✅ Just for debug */}
          <p className="text-xs text-gray-400">[DEBUG] Dialog rendered for: {openType}</p>

          {openType === "add" ? (
            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-bond"
                  checked={newStock.is_bond}
                  onCheckedChange={(checked) =>
                    setNewStock({ ...newStock, is_bond: !!checked })
                  }
                />
                <Label htmlFor="is-bond">This is a bond or fixed-income security</Label>
              </div>

              <div>
                <Label className="text-sm font-medium">Symbol/ID</Label>
                <Input
                  value={newStock.symbol}
                  onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value })}
                  placeholder={newStock.is_bond ? "e.g. 912810RL4" : "e.g. AAPL"}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Amount</Label>
                <Input
                  type="number"
                  value={newStock.amount}
                  onChange={(e) => setNewStock({ ...newStock, amount: e.target.value })}
                  placeholder="Shares or units"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Purchase Price</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={newStock.purchase_price}
                  onChange={(e) => setNewStock({ ...newStock, purchase_price: e.target.value })}
                  placeholder="Price per share/unit"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Current Price (Optional)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={newStock.current_price}
                  onChange={(e) => setNewStock({ ...newStock, current_price: e.target.value })}
                  placeholder="Leave empty to use market data"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Purchase Date</Label>
                <Input
                  type="date"
                  value={newStock.purchase_date}
                  onChange={(e) => setNewStock({ ...newStock, purchase_date: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <Input
                  value={newStock.notes}
                  onChange={(e) => setNewStock({ ...newStock, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <Button onClick={() => {
                addStock();
                setOpenType(null);
              }} className="w-full">
                Add Security
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <Textarea
                value={textImport}
                onChange={(e) => setTextImport(e.target.value)}
                placeholder="Paste your portfolio data here..."
                className="min-h-[200px] mb-4"
              />

              <div className="text-sm text-gray-600">
              <p><strong>English:</strong> AAPL 50 shares at $150</p>
              <p><strong>Bonds:</strong> 2000 of 912810RL4 worth $2,004.98</p>
              <p><strong>Hebrew:</strong> נייר: אפל, כמות: 50, שער אחרון: 150</p>
              <p><strong>CSV style:</strong> Symbol,Amount,Price<br/>AAPL,50,150<br/>MSFT,25,300</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpenType(null)} disabled={processing}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  processTextImport();
                  setOpenType(null);
                }} disabled={processing || !textImport.trim()}>
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Import Data"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}






export default function Portfolio() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("email");
    navigate("/login");
  };
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
  const [newStock, setNewStock] = useState({
    symbol: '',
    amount: '',
    purchase_price: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    is_bond: false,
    current_price: ''
  });

  useEffect(() => {
    loadStocks();
  }, []);

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

  const processTextImport = async () => {
    if (!textImport.trim()) {
      setError("Please enter some data to import");
      return;
    }

    setProcessing(true);
    setError(null);
    
    try {
      // Use LLM to process the text input which could be in Hebrew or English
      const result = await InvokeLLM({
        prompt: `
          The following text contains stock portfolio data. 
          It might be in Hebrew or English and might use different formats.
          
          Parse this data into structured stock entries.
          If Hebrew terms are used, here's how to interpret them:
          - "נייר" or "סימבול" or "מספר נייר" = stock symbol
          - "כמות" = amount of shares
          - "שער קניה" or "מחיר קניה" = purchase price
          - "שער אחרון" or "מחיר אחרון" = current price
          
          For bond and specific securities:
          - Keep the exact symbol format (like 912810RL4)
          - Flag it as a bond if it has a primarily numeric identifier
          - For bonds, calculate per-unit values:
            Example: "2000 of 912810RL4 worth $2,004.98" means:
              - Symbol: 912810RL4
              - Amount: 2000
              - Purchase price: 1.00249 (i.e., $2,004.98 ÷ 2000)
              - Is bond: true
          
          TEXT TO PARSE:
          ${textImport}
          
          Return a clean array of stocks with:
          - symbol: stock symbol exactly as provided (string)
          - amount: number of shares/units (number)
          - purchase_price: purchase price PER SHARE/UNIT (number)
          - purchase_date: today's date in YYYY-MM-DD format (string)
          - is_bond: true if this is likely a bond, false otherwise (boolean)
        `,
        response_json_schema: {
          type: "object",
          properties: {
            stocks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string" },
                  amount: { type: "number" },
                  purchase_price: { type: "number" },
                  purchase_date: { type: "string" },
                  is_bond: { type: "boolean" }
                },
                required: ["symbol", "amount", "purchase_price"]
              }
            }
          }
        }
      });

      if (result && result.stocks && typeof result.stocks === "object") {
        const stocksArray = Object.entries(result.stocks).map(([symbol, data]) => ({
          symbol,
          ...data
        }));
      
        const stocksWithDefaults = Object.entries(result.stocks).map(([symbol, data]) => ({
          symbol: symbol.toUpperCase(),
          amount: Number(data.amount ?? 0), // ← better fallback + parsing
          purchase_price: Number(data.purchase_price ?? 0),
          current_price: Number(data.price ?? data.current_price ?? 0),
          change_percent: Number(data.change_percent ?? 0),
          is_bond: data.is_bond ?? false,
          purchase_date: data.purchase_date || new Date().toISOString().split('T')[0],
        }));
        
        console.log("✅ Final stocks to save:", stocksWithDefaults);
        await Stock.bulkCreate(stocksWithDefaults);
        setStocks((prev) => [...prev, ...stocksWithDefaults]);
        setImportDialogOpen(false);
        setTextImport('');
      } else {
        setError("Couldn't extract portfolio data. Please check your input format.");
      }
    } catch (err) {
      console.error("Error processing text import:", err);
      setError("Error processing the input. Please try a different format.");
    }
    
    setProcessing(false);
  };

  const addStock = async () => {
    if (!newStock.symbol || !newStock.amount || !newStock.purchase_price) {
      setError("Please fill in all required fields");
      return;
    }
    
    try {
      await Stock.create({
        ...newStock,
        symbol: newStock.symbol.trim(),
        amount: Number(newStock.amount),
        purchase_price: Number(newStock.purchase_price),
        current_price: newStock.current_price ? Number(newStock.current_price) : null
      });
      await loadStocks();
      setAddStockOpen(false);
      setNewStock({
        symbol: '',
        amount: '',
        purchase_price: '',
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        is_bond: false,
        current_price: ''
      });
    } catch (err) {
      setError("Error adding stock. Please try again.");
    }
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
    // Use custom price if available, otherwise use market data or purchase price
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 text-sm text-red-600 underline"
        >
          Logout
        </button>
        <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Diversi Metrics</h1>
            <p className="text-green-600 text-xl">Get personal portfolio-based recommendations.</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
          


            {editingStock && (
              <Dialog open={editStockOpen} onOpenChange={setEditStockOpen}>
                <DialogContent className="max-w-md w-full space-y-4">
                  <DialogHeader>
                    <DialogTitle>Edit Security</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-is-bond" 
                        checked={editingStock.is_bond}
                        onCheckedChange={(checked) => setEditingStock({...editingStock, is_bond: checked})}
                      />
                      <Label htmlFor="edit-is-bond">This is a bond or fixed-income security</Label>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Symbol/ID</label>
                      <Input
                        value={editingStock.symbol}
                        onChange={(e) => setEditingStock({...editingStock, symbol: e.target.value})}
                        placeholder={editingStock.is_bond ? "e.g. 912810RL4" : "e.g. AAPL"}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Amount (Number of shares/units)</label>
                      <Input
                        type="number"
                        value={editingStock.amount}
                        onChange={(e) => setEditingStock({...editingStock, amount: e.target.value})}
                        placeholder="Number of shares or units"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Purchase Price (per share/unit)</label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={editingStock.purchase_price}
                        onChange={(e) => setEditingStock({...editingStock, purchase_price: e.target.value})}
                        placeholder="Price per share/unit"
                      />
                      {editingStock.is_bond && (
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
                        value={editingStock.current_price || ''}
                        onChange={(e) => setEditingStock({...editingStock, current_price: e.target.value})}
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
                        value={editingStock.purchase_date}
                        onChange={(e) => setEditingStock({...editingStock, purchase_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Input
                        value={editingStock.notes || ''}
                        onChange={(e) => setEditingStock({...editingStock, notes: e.target.value})}
                        placeholder="Optional notes"
                      />
                    </div>
                    <Button onClick={updateStock} className="w-full">Update Security</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            
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
                  {/* <p>Click "Edit" on any security to modify symbol, amount, or price</p> */}
                  {/* <p className="mt-1">For bonds, use "per unit" price (total value ÷ units)</p>
                  <p className="mt-1">Example: If 2000 units of a bond are worth $2,004.98, the price is $1.00249 per unit</p> */}
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
              {stocks.map((stock) => {
  const currentPrice = stock.current_price
    ? Number(stock.current_price)
    : (!stock.is_bond && marketData[stock.symbol]?.price)
    ? Number(marketData[stock.symbol].price)
    : Number(stock.purchase_price);

  const changePercent = !stock.is_bond && marketData[stock.symbol]?.change_percent
    ? Number(marketData[stock.symbol].change_percent)
    : 0;

  const purchasePrice = Number(stock.purchase_price);
  const totalValue = stock.amount * currentPrice;
  const gainLoss = totalValue - (stock.amount * purchasePrice);
  const gainLossPercent = purchasePrice > 0
    ? ((currentPrice / purchasePrice - 1) * 100)
    : 0;
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
      <td className="p-4 text-right">
        {Number(stock.amount).toLocaleString()}
      </td>
      <td className="p-4 text-right">
        {purchasePrice !== undefined ? `$${purchasePrice.toFixed(4)}` : "-"}
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {currentPrice !== undefined ? `$${currentPrice.toFixed(4)}` : "-"}
          {!stock.is_bond && !stock.current_price && !manualPrices && (
            <Badge
              variant="outline"
              className={changePercent >= 0 ? "text-green-600" : "text-red-600"}
            >
              {changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(2)}%
            </Badge>
          )}
          {(stock.current_price || manualPrices) && (
            <span className="text-xs text-gray-500">(manual)</span>
          )}
        </div>
      </td>
      <td className="p-4 text-right font-medium">
        {totalValue !== undefined ? `$${totalValue.toFixed(2)}` : "-"}
      </td>
      <td className={`p-4 text-right font-medium ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
        {gainLoss !== undefined ? `$${gainLoss.toFixed(2)}` : "-"}
        <span className="block text-xs">
          {gainLossPercent !== undefined
            ? `(${gainLoss >= 0 ? "+" : ""}${gainLossPercent.toFixed(2)}%)`
            : ""}
        </span>
      </td>
      <td className="p-4">
        <div className="flex justify-center gap-1">
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
      </td>
    </tr>
  );
})}

</tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan="3" className="p-4 font-bold text-right">Total:</td>
                  <td colSpan="5" className="p-4 font-bold text-right">
                    ${stocks.reduce((sum, stock) => sum + calculateTotalValue(stock), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <FloatingActions
          newStock={newStock}
          setNewStock={setNewStock}
          addStock={addStock}
          textImport={textImport}
          setTextImport={setTextImport}
          processTextImport={processTextImport}
          processing={processing}
        />



      </div>
    </div>
    
  );
}

