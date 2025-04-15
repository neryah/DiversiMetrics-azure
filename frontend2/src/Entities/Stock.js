// src/Entities/Stock.js

export const Stock = {
  list: async () => {
    const raw = localStorage.getItem("portfolio");
    return raw ? JSON.parse(raw) : [];
  },

  create: async (stock) => {
    const portfolio = await Stock.list();
    portfolio.push({ ...stock, id: Date.now() });
    localStorage.setItem("portfolio", JSON.stringify(portfolio));
  },

  update: async (id, updated) => {
    let portfolio = await Stock.list();
    portfolio = portfolio.map((s) => (s.id === id ? { ...s, ...updated } : s));
    localStorage.setItem("portfolio", JSON.stringify(portfolio));
  },

  delete: async (id) => {
    let portfolio = await Stock.list();
    portfolio = portfolio.filter((s) => s.id !== id);
    localStorage.setItem("portfolio", JSON.stringify(portfolio));
  },

  bulkCreate: async (newStocks) => {
    const existing = await Stock.list();
    const merged = [...existing];
  
    for (const newStock of newStocks) {
      const symbol = newStock.symbol.toUpperCase(); // 🔁 Normalize symbol casing
      const index = merged.findIndex(s => s.symbol.toUpperCase() === symbol);
  
      if (index !== -1) {
        const existingStock = merged[index];
        merged[index] = {
          ...existingStock,
          amount: (existingStock.amount || 0) + (newStock.amount || 0), // ✅ sum amounts
          purchase_price: newStock.purchase_price ?? existingStock.purchase_price,
          purchase_date: newStock.purchase_date || existingStock.purchase_date,
          is_bond: newStock.is_bond ?? existingStock.is_bond,
          current_price: newStock.current_price ?? existingStock.current_price,
          id: existingStock.id, // 🧷 keep existing ID to prevent duplicates
        };
      } else {
        merged.push({
          ...newStock,
          symbol, // ensure upper case
          id: `${symbol}-${Date.now()}` // 🆕 generate unique ID
        });
      }
    }
  
    console.log("✅ New stocks:", newStocks);
    console.log("✅ Merged portfolio:", merged);
  
    localStorage.setItem("portfolio", JSON.stringify(merged));
  }
  
  
};


// // src/entities/Stock.js
// import { CosmosClient } from "@azure/cosmos";

// const cosmosClient = new CosmosClient(process.env.REACT_APP_COSMOS_CONNECTION_STRING);
// const database = cosmosClient.database("PortfolioDB");
// const stocksContainer = database.container("Stocks");

// export const Stock = {
//   list: async (userId) => {
//     const querySpec = {
//       query: "SELECT * FROM c WHERE c.userId = @userId",
//       parameters: [{ name: "@userId", value: userId }]
//     };
//     const { resources } = await stocksContainer.items.query(querySpec).fetchAll();
//     return resources;
//   },

//   create: async (stockData) => {
//     const { resource: createdStock } = await stocksContainer.items.create(stockData);
//     return createdStock;
//   },

//   update: async (id, stockData) => {
//     const { resource: updatedStock } = await stocksContainer.item(id).replace(stockData);
//     return updatedStock;
//   },

//   delete: async (id) => {
//     await stocksContainer.item(id).delete();
//   }
// };