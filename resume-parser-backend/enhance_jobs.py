# Requirements: pip install sentence-transformers pymongo python-dotenv google-generativeai numpy

import os
import pymongo
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

client = pymongo.MongoClient(MONGO_URI)
db = client["resume_parser"]
jobs_collection = db["jobs"]

model = SentenceTransformer('all-MiniLM-L6-v2')

def enhance_job_description(description):
    model_gemini = genai.GenerativeModel('models/gemini-2.5-flash')
    prompt = (
        "Rewrite the following job description to clearly list all key skills, requirements, and responsibilities. "
        "Make it concise and easy to match with candidate resumes:\n\n"
        f"{description}"
    )
    response = model_gemini.generate_content(prompt)
    return response.text

jobs = list(jobs_collection.find({}))
print(f"Found {len(jobs)} jobs.")

for job in jobs:
    job_id = job["_id"]
    original_desc = job.get("description", "")
    if not original_desc:
        continue

    # Enhance the job description
    enhanced_desc = enhance_job_description(original_desc)
    # Generate embedding
    embedding = model.encode(enhanced_desc)
    embedding_list = embedding.tolist()

    # Store enhanced description and embedding in the job document
    jobs_collection.update_one(
        {"_id": job_id},
        {"$set": {
            "enhanced_description": enhanced_desc,
            "embedding": embedding_list
        }}
    )
    print(f"Stored enhanced description and embedding for job {job_id}")

print("All job descriptions enhanced and embedded.")