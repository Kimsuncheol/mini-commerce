# Morpheme Analysis API

This API provides morpheme analysis functionality using spaCy. It breaks down words into their component morphemes (prefixes, roots, and suffixes) and provides additional linguistic information.

## Setup

### Requirements
- Python 3.8+
- spaCy
- Flask

### Installation

1. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

2. Download the spaCy English model:
   ```
   python -m spacy download en_core_web_sm
   ```

## Usage

### Starting the Server

Run the server with:
```
python app.py
```

Or use the provided shell script:
```
sh start.sh
```

The API will be available at http://localhost:5000.

### API Endpoints

#### POST /api/morpheme-analysis
Analyzes text to break it down into morphemes.

**Request body:**
```json
{
  "text": "The unhappiness of the children was noticeable"
}
```

**Response:**
```json
{
  "success": true,
  "result": [
    {
      "text": "The",
      "lemma": "the",
      "pos": "DET",
      "tag": "DT",
      "morph": "Definite=Def|PronType=Art",
      "is_stop": true,
      "morphemes": [
        {
          "type": "root",
          "text": "the"
        }
      ]
    },
    {
      "text": "unhappiness",
      "lemma": "unhappiness",
      "pos": "NOUN",
      "tag": "NN",
      "morph": "Number=Sing",
      "is_stop": false,
      "morphemes": [
        {
          "type": "prefix",
          "text": "un"
        },
        {
          "type": "root",
          "text": "happi"
        },
        {
          "type": "suffix",
          "text": "ness"
        }
      ]
    },
    // Additional tokens...
  ]
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Integration with React Frontend

This API is designed to work with the React frontend. Make sure the API is running before using the Morpheme Analyzer component.

## Limitations

- The morpheme analysis is based on a simplified rule-based approach that handles common English patterns.
- It may not correctly identify all morphemes in complex words or in specialized vocabulary.
- For a more comprehensive morphological analysis, a dedicated morphological analyzer or more sophisticated approaches would be needed. 