"""
Portfolio Optimization API Server
FastAPI implementation with Azure Cosmos DB and Blob Storage integration
"""

import os
import logging
from typing import List, Tuple, Optional
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
import pandas as pd

# Azure SDK imports
from azure.storage.blob import BlobServiceClient
from azure.cosmos import CosmosClient, exceptions as cosmos_exceptions

# Core portfolio logic
from portfolio_manager import PortfolioManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Portfolio Optimization API",
    description="REST API for portfolio rebalancing recommendations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None
)

# Security setup
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Pydantic models
class RecommendationRequest(BaseModel):
    user_id: str = Field(..., min_length=1, example="user-12345")
    amount: float = Field(..., gt=0, example=5000.0)
    max_recommendations: Optional[int] = Field(5, ge=1, le=10)

class RecommendationItem(BaseModel):
    ticker: str
    amount: float
    sharpe_improvement: float

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]
    current_sharpe: float
    projected_sharpe: float
    portfolio_value: float

# Azure configuration
AZURE_CONFIG = {
    "blob_conn_str": os.getenv("AZURE_BLOB_CONN_STR"),
    "blob_container": os.getenv("BLOB_CONTAINER", "price-data"),
    "cosmos_conn_str": os.getenv("AZURE_COSMOS_CONN_STR"),
    "cosmos_db": os.getenv("COSMOS_DB", "portfolio-db"),
    "cosmos_container": os.getenv("COSMOS_CONTAINER", "users")
}

# Dependency setup
async def validate_api_key(api_key: str = Security(api_key_header)):
    if not os.getenv("API_KEY") or api_key == os.getenv("API_KEY"):
        return True
    raise HTTPException(status_code=403, detail="Invalid API Key")

# Helper functions
def get_blob_client():
    """Azure Blob Storage client factory"""
    try:
        return BlobServiceClient.from_connection_string(
            AZURE_CONFIG["blob_conn_str"]
        )
    except Exception as e:
        logger.error(f"Blob client error: {str(e)}")
        raise HTTPException(500, "Storage connection failed")

def get_cosmos_container():
    """Azure Cosmos DB container factory"""
    try:
        client = CosmosClient.from_connection_string(
            AZURE_CONFIG["cosmos_conn_str"]
        )
        database = client.get_database_client(AZURE_CONFIG["cosmos_db"])
        return database.get_container_client(AZURE_CONFIG["cosmos_container"])
    except Exception as e:
        logger.error(f"Cosmos client error: {str(e)}")
        raise HTTPException(500, "Database connection failed")

async def fetch_historical_data() -> pd.DataFrame:
    """Retrieve price data from Azure Blob Storage"""
    try:
        blob_client = get_blob_client().get_blob_client(
            container=AZURE_CONFIG["blob_container"],
            blob="historical_prices.csv"
        )
        data = blob_client.download_blob().readall()
        return pd.read_csv(data, index_col='Date', parse_dates=True)
    except Exception as e:
        logger.error(f"Data load failed: {str(e)}")
        raise HTTPException(500, "Failed to load price data")

async def fetch_user_portfolio(user_id: str) -> tuple[List[str], List[float]]:
    """Retrieve user portfolio from Cosmos DB"""
    container = get_cosmos_container()
    try:
        user_item = container.read_item(item=user_id, partition_key=user_id)
        return (
            user_item.get("stocks", []),
            user_item.get("amounts", [])
        )
    except cosmos_exceptions.CosmosResourceNotFoundError:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(404, "User portfolio not found")
    except Exception as e:
        logger.error(f"Cosmos error: {str(e)}")
        raise HTTPException(500, "Database operation failed")

# API Endpoints
@app.post(
    "/recommend/buy",
    response_model=RecommendationResponse,
    dependencies=[Depends(validate_api_key)]
)
async def generate_buy_recommendations(
    request: RecommendationRequest
):
    """
    Generate buy recommendations to optimize portfolio Sharpe ratio
    
    - **user_id**: Unique user identifier
    - **amount**: Investment amount in USD
    - **max_recommendations**: Number of recommendations to return (1-10)
    """
    try:
        # Fetch data from Azure services
        stocks, amounts = await fetch_user_portfolio(request.user_id)
        historical_data = await fetch_historical_data()
        
        # Initialize portfolio manager
        pm = PortfolioManager(
            initial_stocks=stocks,
            initial_weights=amounts,
            historical_data=historical_data
        )
        
        # Generate recommendations
        recommendations = pm.get_buy_recommendations(
            amount=request.amount,
            max_recommendations=request.max_recommendations
        )
        
        # Format response
        return {
            "recommendations": [{
                "ticker": ticker,
                "amount": request.amount,
                "sharpe_improvement": improvement
            } for ticker, improvement in recommendations],
            "current_sharpe": pm.calculate_sharpe_ratio(),
            "projected_sharpe": max([imp for _, imp in recommendations], default=0),
            "portfolio_value": pm.portfolio_value + request.amount
        }
        
    except ValueError as e:
        logger.error(f"Input error: {str(e)}")
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(500, "Recommendation processing failed")

@app.post(
    "/recommend/sell",
    response_model=RecommendationResponse,
    dependencies=[Depends(validate_api_key)]
)
async def generate_sell_recommendations(
    request: RecommendationRequest
):
    """Generate sell recommendations to optimize portfolio Sharpe ratio"""
    try:
        stocks, amounts = await fetch_user_portfolio(request.user_id)
        historical_data = await fetch_historical_data()
        
        pm = PortfolioManager(stocks, amounts, historical_data)
        
        recommendations = pm.get_sell_recommendations(
            amount=request.amount,
            max_recommendations=request.max_recommendations
        )
        
        return {
            "recommendations": [{
                "ticker": ticker,
                "amount": min(request.amount, pm.portfolio_weights.get(ticker, 0) * pm.portfolio_value),
                "sharpe_improvement": improvement
            } for ticker, improvement in recommendations],
            "current_sharpe": pm.calculate_sharpe_ratio(),
            "projected_sharpe": max([imp for _, imp in recommendations], default=0),
            "portfolio_value": pm.portfolio_value - request.amount
        }
        
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Sell recommendation error: {str(e)}")
        raise HTTPException(500, "Sell recommendation failed")

@app.get("/health", include_in_schema=False)
async def health_check():
    """System health endpoint"""
    try:
        # Verify Azure connections
        get_blob_client().get_account_information()
        get_cosmos_container().read_item(item="healthcheck", partition_key="healthcheck")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(500, "Service unavailable")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        log_level="info"
    )