const { MongoClient } = require('mongodb');
const { cosineSimilarity } = require('./cosine');
const Job = require('./job.model');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'resumeParserDB';

async function debugEmptyResume() {
  let client;
  
  try {
    console.log('🔍 Debugging Empty Resume Issue...\n');
    
    // Connect to MongoDB
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get all resumes
    const resumes = await db.collection('resumes').find({}).toArray();
    console.log(`📄 Found ${resumes.length} total resumes\n`);
    
    // Analyze each resume
    resumes.forEach((resume, index) => {
      console.log(`--- Resume ${index + 1} ---`);
      console.log('Has embedding:', !!resume.embedding);
      console.log('Embedding length:', resume.embedding?.length || 0);
      console.log('Parsed resume keys:', Object.keys(resume.parsedResume || {}));
      
      const parsed = resume.parsedResume || {};
      console.log('Name:', parsed.name || 'EMPTY');
      console.log('Skills:', parsed.skills || 'EMPTY');
      console.log('Experience:', parsed.experience || 'EMPTY');
      console.log('Summary:', parsed.summary || 'EMPTY');
      
      // Check if this is essentially an empty resume
      const hasContent = !!(parsed.name || parsed.skills || parsed.experience || parsed.summary || parsed.education);
      console.log('Has meaningful content:', hasContent);
      
      // Check embedding values
      if (resume.embedding) {
        const avgEmbedding = resume.embedding.reduce((a, b) => a + b, 0) / resume.embedding.length;
        const isZeroEmbedding = resume.embedding.every(val => Math.abs(val) < 0.001);
        console.log('Average embedding value:', avgEmbedding.toFixed(6));
        console.log('Is zero/near-zero embedding:', isZeroEmbedding);
      }
      
      console.log('');
    });
    
    // Test with a sample job
    const jobs = await Job.find({ embedding: { $exists: true } }).limit(1);
    if (jobs.length > 0) {
      const job = jobs[0];
      console.log('🎯 Testing similarity with job:', job.title);
      console.log('Job embedding length:', job.embedding.length);
      
      console.log('\n📊 Similarity scores:');
      resumes.forEach((resume, index) => {
        if (resume.embedding && job.embedding) {
          try {
            const score = cosineSimilarity(job.embedding, resume.embedding);
            const parsed = resume.parsedResume || {};
            const hasContent = !!(parsed.name || parsed.skills || parsed.experience || parsed.summary);
            
            console.log(`Resume ${index + 1}: Score=${score.toFixed(4)}, HasContent=${hasContent}, Name="${parsed.name || 'EMPTY'}"`);
          } catch (error) {
            console.log(`Resume ${index + 1}: Error calculating similarity - ${error.message}`);
          }
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    if (client) await client.close();
  }
}

debugEmptyResume();