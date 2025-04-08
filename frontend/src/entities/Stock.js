// src/entities/Stock.js
import { CosmosClient } from "@azure/cosmos";

const cosmosClient = new CosmosClient(process.env.REACT_APP_COSMOS_CONNECTION_STRING);
const database = cosmosClient.database("PortfolioDB");
const stocksContainer = database.container("Stocks");

export const Stock = {
  list: async (userId) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId",
      parameters: [{ name: "@userId", value: userId }]
    };
    const { resources } = await stocksContainer.items.query(querySpec).fetchAll();
    return resources;
  },

  create: async (stockData) => {
    const { resource: createdStock } = await stocksContainer.items.create(stockData);
    return createdStock;
  },

  update: async (id, stockData) => {
    const { resource: updatedStock } = await stocksContainer.item(id).replace(stockData);
    return updatedStock;
  },

  delete: async (id) => {
    await stocksContainer.item(id).delete();
  }
};