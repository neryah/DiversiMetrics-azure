#!/bin/bash
export FLASK_APP=api_server.py
export FLASK_RUN_HOST=0.0.0.0
export FLASK_RUN_PORT=8000
pip install -r requirements.txt
flask run
