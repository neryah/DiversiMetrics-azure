// src/services/auth.js
import { CosmosClient } from "@azure/cosmos";

const cosmosClient = new CosmosClient(process.env.REACT_APP_COSMOS_CONNECTION_STRING);
const database = cosmosClient.database("PortfolioDB");
const usersContainer = database.container("Users");

export const authService = {
  login: async (email, password) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: email }]
    };

    const { resources } = await usersContainer.items.query(querySpec).fetchAll();
    
    if (resources.length === 0) throw new Error("User not found");
    const user = resources[0];
    
    if (user.password !== password) throw new Error("Invalid password");
    
    return {
      id: user.id,
      email: user.email,
      name: user.name
    };
  },

  register: async (userData) => {
    const { resources } = await usersContainer.items.query({
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: userData.email }]
    }).fetchAll();

    if (resources.length > 0) throw new Error("User already exists");
    
    const newUser = {
      ...userData,
      createdAt: new Date().toISOString(),
      portfolios: []
    };

    const { resource: createdUser } = await usersContainer.items.create(newUser);
    return createdUser;
  }
};