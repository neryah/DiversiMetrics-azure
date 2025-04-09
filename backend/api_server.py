"""
Portfolio Optimization API Server
FastAPI implementation with Azure Cosmos DB and Blob Storage integration
"""


from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt
import os
import traceback

# Load environment variables
load_dotenv()

# Flask setup
app = Flask(__name__)
CORS(app)

# MongoDB setup
mongo_uri = os.getenv("MONGO_URI")
mongo_db = os.getenv("MONGO_DB")

client = MongoClient(mongo_uri)
db = client[mongo_db]
users_collection = db["users"]

@app.route("/api/ping")
def ping():
    return jsonify({"message": "pong"})


@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        if users_collection.find_one({"email": email}):
            return jsonify({"error": "User already exists"}), 409

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        users_collection.insert_one({
            "email": email,
            "password_hash": password_hash
        })

        return jsonify({"message": "User registered successfully!"}), 201

    except Exception as e:
        print("❌ Error in /api/register:", e)
        traceback.print_exc()  # This prints the full stack trace in terminal
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"error": "User not found"}), 404

        if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
            return jsonify({"error": "Incorrect password"}), 401

        return jsonify({"message": "Login successful!"}), 200

    except Exception as e:
        print("❌ Error in /api/login:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error"}), 500




import pandas as pd
from portfolio_manager import PortfolioManager

CSV_PATH = "historical_adjusted_prices.csv"

@app.route("/api/buy", methods=["POST"])
def recommend_buy():
    try:
        data = request.get_json()
        tickers = data.get("tickers", [])
        amounts = data.get("amounts", [])
        budget = float(data.get("budget", 0))

        if not tickers or not amounts or len(tickers) != len(amounts):
            return jsonify({"error": "Invalid portfolio format"}), 400

        historical_data = pd.read_csv(CSV_PATH, index_col="Date", parse_dates=True)
        pm = PortfolioManager(tickers, amounts, historical_data)

        result = pm.get_buy_recommendations(budget)
        result["portfolio_value"] = pm.portfolio_value  # Add total value for context

        return jsonify(result)

    except Exception as e:
        print("❌ Error in /api/buy:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error"}), 500



@app.route("/api/sell", methods=["POST"])
def recommend_sell():
    try:
        data = request.get_json()
        tickers = data.get("tickers", [])
        amounts = data.get("amounts", [])
        budget = float(data.get("budget", 0))

        if not tickers or not amounts or len(tickers) != len(amounts):
            return jsonify({"error": "Invalid portfolio format"}), 400

        historical_data = pd.read_csv(CSV_PATH, index_col="Date", parse_dates=True)
        pm = PortfolioManager(tickers, amounts, historical_data)

        result = pm.get_sell_recommendations(budget)
        result["portfolio_value"] = pm.portfolio_value  # Add total value

        return jsonify(result)

    except Exception as e:
        print("❌ Error in /api/sell:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error"}), 500

