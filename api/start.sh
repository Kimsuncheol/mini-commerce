#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Download spaCy model if not already present
python -m spacy download en_core_web_sm

# Start the server
python app.py 