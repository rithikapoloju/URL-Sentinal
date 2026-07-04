import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
from urllib.parse import urlparse

# --- 1. Feature Extraction Function ---
def get_simplified_features_from_url(url):
    """Calculates a simplified set of features for a URL."""
    parsed_url = urlparse(url)
    features = {
        'length_url': len(url),
        'nb_dots': url.count('.'),
        'nb_hyphens': url.count('-'),
        'https_token': 1 if parsed_url.scheme in ['https', 'shttp'] else 0,
    }
    return features

# --- 2. Load and Prepare Data ---
try:
    data = pd.read_csv('phishing_site_urls.csv')
except FileNotFoundError:
    print("Error: 'phishing_site_urls.csv' not found. Ensure the file is present.")
    exit()

data['status'] = data['status'].map({'legitimate': 0, 'phishing': 1})
FEATURE_COLUMNS = ['length_url', 'nb_dots', 'nb_hyphens', 'https_token']
X = data[FEATURE_COLUMNS]
y = data['status']

# --- 3. Train the Model ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"\nModel Accuracy on Test Set: {accuracy_score(y_test, y_pred):.4f}")

# --- 4. Save the Model and Feature List ---
model_filename = 'phishing_model.pkl'
feature_list_filename = 'model_features.pkl'

with open(model_filename, 'wb') as file:
    pickle.dump(model, file)
print(f"Model saved successfully as '{model_filename}'.")

with open(feature_list_filename, 'wb') as file:
    pickle.dump(FEATURE_COLUMNS, file)
print(f"Feature list saved successfully as '{feature_list_filename}'.")



