# Requirements: pip install sentence-transformers pymongo python-dotenv numpy

import os
import pymongo
import numpy as np
from sentence_transformers import SentenceTransformer
try:
    from dotenv import load_dotenv
except ImportError:
    raise ImportError("Please install python-dotenv: pip install python-dotenv")

import google.generativeai as genai

# Load environment variables from .env if present
load_dotenv()

# Set your Gemini API key from environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

def enhance_job_description(description):
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = (
        "Rewrite the following job description to clearly list all key skills, requirements, and responsibilities. "
        "Make it concise and easy to match with candidate resumes:\n\n"
        f"{description}"
    )
    response = model.generate_content(prompt)
    return response.text

# Example usage
job_desc = "We are looking for a software engineer with experience in Python, cloud, and teamwork. The candidate should be able to work in a fast-paced environment and have good communication skills."
enhanced = enhance_job_description(job_desc)
print(enhanced)

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "resume_parser"
COLLECTION_NAME = "resumes"

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# Load the embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Fetch all resumes
resumes = list(collection.find({}))

print(f"Found {len(resumes)} resumes.")

for resume in resumes:
    resume_id = resume["_id"]
    # You may want to customize this to use the most relevant text fields
    text = ""
    if "parsedResume" in resume:
        # Flatten all text fields in parsedResume
        parsed = resume["parsedResume"]
        if isinstance(parsed, dict):
            text = " ".join(str(v) for v in parsed.values() if v)
        else:
            text = str(parsed)
    else:
        text = str(resume)

    # Generate embedding
    embedding = model.encode(text)
    embedding_list = embedding.tolist()  # Convert numpy array to list for MongoDB

    # Store embedding in the document
    collection.update_one(
        {"_id": resume_id},
        {"$set": {"embedding": embedding_list}}
    )
    print(f"Stored embedding for resume {_id}")

print("All embeddings generated and stored.")