import numpy as np
import pymongo
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = pymongo.MongoClient(MONGO_URI)
db = client["resume_parser"]
jobs_collection = db["jobs"]
resumes_collection = db["resumes"]
 
def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# List all jobs with their titles and IDs
jobs = list(jobs_collection.find({}))
if not jobs:
    print("No jobs found in the database.")
    exit(1)

print("Available jobs:")
for idx, job in enumerate(jobs):
    print(f"{idx+1}. {job.get('title', 'No Title')} (ID: {job['_id']})")

# Prompt user to select a job by index
try:
    selected_idx = int(input(f"Select a job to match resumes (1-{len(jobs)}): ")) - 1
    if not (0 <= selected_idx < len(jobs)):
        raise ValueError
except ValueError:
    print("Invalid selection.")
    exit(1)

job = jobs[selected_idx]
job_embedding = job.get("embedding")
if not job_embedding:
    print("Selected job does not have an embedding. Run enhance_jobs.py first.")
    exit(1)

matches = []
for resume in resumes_collection.find({"embedding": {"$exists": True}}):
    sim = cosine_similarity(job_embedding, resume["embedding"])
    matches.append((sim, resume))

if not matches:
    print("No resumes with embeddings found.")
    exit(1)

# Sort by similarity, descending
matches.sort(reverse=True, key=lambda x: x[0])

# Print top 5 matches
print("\nTop 5 matching resumes:")
for sim, resume in matches[:5]:
    print(f"Score: {sim:.3f}, Resume: {resume.get('parsedResume', resume)}\n")
