const { MongoClient } = require('mongodb');
const { cosineSimilarity } = require('./cosine');
const Job = require('./job.model');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'resumeParserDB';

async function debugScoring() {
  let client;
  
  try {
    console.log('🔍 Debugging Identical Scoring Issue...\n');
    
    // Connect to MongoDB with proper connection handling
    const mongoose = require('mongoose');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB for debugging\n');
    
    // Connect to raw MongoDB client as well
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get a job with embedding
    const jobs = await Job.find({ embedding: { $exists: true, $ne: [] } }).limit(1);
    if (!jobs.length) {
      console.log('❌ No jobs with embeddings found');
      return;
    }
    
    const job = jobs[0];
    console.log('📋 Testing with job:', job.title);
    console.log('Job embedding length:', job.embedding.length);
    console.log('Job embedding sample (first 10):', job.embedding.slice(0, 10));
    console.log('Job embedding stats:');
    console.log('  - Min value:', Math.min(...job.embedding));
    console.log('  - Max value:', Math.max(...job.embedding));
    console.log('  - Average:', (job.embedding.reduce((a, b) => a + b, 0) / job.embedding.length).toFixed(6));
    console.log('  - All zeros?', job.embedding.every(val => Math.abs(val) < 0.001));
    console.log('');
    
    // Get resumes with embeddings
    const resumes = await db.collection('resumes').find({ embedding: { $exists: true } }).toArray();
    console.log(`📄 Found ${resumes.length} resumes with embeddings\n`);
    
    if (!resumes.length) {
      console.log('❌ No resumes with embeddings found');
      return;
    }
    
    // Analyze each resume embedding
    console.log('📊 Resume Embedding Analysis:');
    resumes.forEach((resume, index) => {
      console.log(`--- Resume ${index + 1} ---`);
      const parsed = resume.parsedResume || {};
      console.log('Name:', parsed.name || 'Unnamed');
      console.log('Embedding length:', resume.embedding?.length || 0);
      
      if (resume.embedding) {
        console.log('Embedding sample (first 10):', resume.embedding.slice(0, 10));
        console.log('Embedding stats:');
        console.log('  - Min value:', Math.min(...resume.embedding));
        console.log('  - Max value:', Math.max(...resume.embedding));
        console.log('  - Average:', (resume.embedding.reduce((a, b) => a + b, 0) / resume.embedding.length).toFixed(6));
        console.log('  - All zeros?', resume.embedding.every(val => Math.abs(val) < 0.001));
        
        // Test similarity calculation
        if (job.embedding.length === resume.embedding.length) {
          try {
            const similarity = cosineSimilarity(job.embedding, resume.embedding);
            console.log('  - Similarity to job:', similarity.toFixed(6));
          } catch (error) {
            console.log('  - Similarity calculation error:', error.message);
          }
        } else {
          console.log('  - Dimension mismatch with job embedding');
        }
      }
      console.log('');
    });
    
    // Test if all embeddings are identical
    console.log('🔍 Checking for identical embeddings:');
    if (resumes.length > 1) {
      const firstEmbedding = resumes[0].embedding;
      const allIdentical = resumes.every(resume => {
        if (!resume.embedding || resume.embedding.length !== firstEmbedding.length) return false;
        return resume.embedding.every((val, idx) => Math.abs(val - firstEmbedding[idx]) < 0.0001);
      });
      
      console.log('All resume embeddings identical?', allIdentical);
      
      if (allIdentical) {
        console.log('🚨 PROBLEM FOUND: All resume embeddings are identical!');
        console.log('This explains why all scores are the same.');
        console.log('Possible causes:');
        console.log('1. Empty text being sent to embedding generation');
        console.log('2. Same default text being used for all resumes');
        console.log('3. Embedding generation script returning same values');
      }
    }
    
    // Test cosine similarity function directly
    console.log('🧮 Testing cosine similarity function:');
    const testVec1 = [1, 0, 0];
    const testVec2 = [0, 1, 0];
    const testVec3 = [1, 0, 0];
    
    console.log('Test vectors:');
    console.log('Vec1:', testVec1, 'Vec2:', testVec2, 'Vec3:', testVec3);
    console.log('Similarity(Vec1, Vec2):', cosineSimilarity(testVec1, testVec2)); // Should be 0
    console.log('Similarity(Vec1, Vec3):', cosineSimilarity(testVec1, testVec3)); // Should be 1
    console.log('Similarity(Vec2, Vec3):', cosineSimilarity(testVec2, testVec3)); // Should be 0
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    if (client) await client.close();
  }
}

debugScoring();