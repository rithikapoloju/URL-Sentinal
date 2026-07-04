import pandas as pd
from flask import Flask, request, jsonify, render_template
import pickle
from flask_cors import CORS
from urllib.parse import urlparse
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

# --- 1. Feature Extraction Function (MUST match the one in train_model.py) ---
def get_simplified_features(url):
    """Calculates the simplified set of features for a new URL."""
    parsed_url = urlparse(url)
    features = {
        'length_url': len(url),
        'nb_dots': url.count('.'),
        'nb_hyphens': url.count('-'),
        'https_token': 1 if parsed_url.scheme in ['https', 'shttp'] else 0,
    }
    return features

# --- 2. Flask Setup and Model Loading ---
app = Flask(__name__)
CORS(app) # Enable CORS for the Chrome extension

MODEL_FEATURES = []
model = None
try:
    with open('phishing_model.pkl', 'rb') as file:
        model = pickle.load(file)
    with open('model_features.pkl', 'rb') as file:
        MODEL_FEATURES = pickle.load(file)
    app.logger.info(f"Model loaded successfully, expecting {len(MODEL_FEATURES)} features.")
except FileNotFoundError as e:
    app.logger.error(f"Error loading model files: {e}. Run train_model.py first!")

# --- 3. Frontend Route (Serves the index.html from the 'templates' folder) ---
@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

# --- 4. API Route (Used by Chrome Extension and Web UI) ---
@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Model not loaded on the server.'}), 500

    if not request.json or 'url' not in request.json:
        return jsonify({'error': 'Missing URL in request body.'}), 400

    url = request.json['url']
    
    try:
        features_dict = get_simplified_features(url)
        X_predict = pd.DataFrame([features_dict], columns=MODEL_FEATURES)
        
        prediction_result = model.predict(X_predict)[0]
        confidence_scores = model.predict_proba(X_predict)[0]
        malicious_confidence = confidence_scores[1] * 100
        
        return jsonify({
            'url': url,
            'is_phishing': bool(prediction_result), 
            'confidence': round(malicious_confidence, 2)
        })

    except Exception as e:
        app.logger.error(f"Prediction error for URL {url}: {e}")
        return jsonify({'error': 'An internal server error occurred during prediction.'}), 500

if __name__ == '__main__':
    app.run(debug=True)
