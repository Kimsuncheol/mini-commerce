from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load spaCy model - will need to download with: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
    print("Successfully loaded spaCy model")
except OSError:
    print("Downloading spaCy model...")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")
    print("Successfully loaded spaCy model after downloading")

def analyze_morphemes(text):
    """
    Analyze morphemes in text using spaCy.
    This breaks down words into prefixes, roots, and suffixes where possible.
    """
    doc = nlp(text)
    result = []
    
    for token in doc:
        # Get basic token information
        token_data = {
            "text": token.text,
            "lemma": token.lemma_,
            "pos": token.pos_,
            "tag": token.tag_,
            "morph": str(token.morph),
            "is_stop": token.is_stop,
            "morphemes": []
        }
        
        # Break down into morphemes
        # spaCy doesn't directly provide morpheme analysis, but we can combine
        # morphological features with rule-based approach
        
        # Get the morphological features
        morph_features = token.morph.to_dict()
        
        # Extract morphemes based on common English patterns
        # This is a simplified approach; a full implementation would require more rules
        word = token.text.lower()
        
        # Skip very short words or punctuation
        if len(word) <= 2 or not word.isalpha():
            token_data["morphemes"].append({"type": "root", "text": word})
            result.append(token_data)
            continue
            
        morphemes = []
        
        # Check for common prefixes
        prefixes = ["un", "re", "in", "im", "dis", "pre", "post", "anti", "auto", "bi", "co", "de", "en", "ex", "inter", "mis", "non", "over", "semi", "sub", "super", "trans", "under"]
        prefix_found = False
        
        for prefix in prefixes:
            if word.startswith(prefix) and len(word) > len(prefix) + 1:
                morphemes.append({"type": "prefix", "text": prefix})
                word = word[len(prefix):]
                prefix_found = True
                break
                
        # Check for common suffixes
        suffixes = ["ing", "ed", "ly", "er", "est", "s", "es", "ment", "ness", "ful", "less", "able", "ible", "al", "ial", "ic", "ical", "ious", "ous", "ive", "ative", "ize", "ise", "fy", "en"]
        suffix_found = False
        
        for suffix in suffixes:
            if word.endswith(suffix) and len(word) > len(suffix) + 1:
                root = word[:-len(suffix)]
                morphemes.append({"type": "root", "text": root})
                morphemes.append({"type": "suffix", "text": suffix})
                suffix_found = True
                break
                
        # If no suffix was found, consider the remaining part as the root
        if not suffix_found:
            morphemes.append({"type": "root", "text": word})
            
        # If we identified morphemes, add them
        if morphemes:
            token_data["morphemes"] = morphemes
            
        # If no morphemes were identified through the rule-based approach,
        # fallback to just using the whole word as a root morpheme
        if not token_data["morphemes"]:
            token_data["morphemes"].append({"type": "root", "text": token.text.lower()})
            
        result.append(token_data)
    
    return result

@app.route('/api/morpheme-analysis', methods=['POST'])
def analyze():
    """API endpoint for morpheme analysis"""
    data = request.json
    
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
        
    text = data['text']
    
    try:
        analysis = analyze_morphemes(text)
        return jsonify({"success": True, "result": analysis})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 