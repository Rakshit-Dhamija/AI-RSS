#!/usr/bin/env python3
"""
Simple script to generate embeddings using SentenceTransformers
Reads text from stdin and outputs JSON embedding to stdout
"""

import sys
import json
from sentence_transformers import SentenceTransformer

def main():
    try:
        # Load the model (this will download it on first run)
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Read text from stdin
        text = sys.stdin.read().strip()
        
        if not text:
            raise ValueError("No text provided")
        
        # Generate embedding
        embedding = model.encode(text)
        
        # Convert to list and output as JSON
        embedding_list = embedding.tolist()
        print(json.dumps(embedding_list))
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()