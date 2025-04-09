#!/bin/bash
pip install -r requirements.txt
exec gunicorn -w 4 -b 0.0.0.0:$PORT api_server:app
