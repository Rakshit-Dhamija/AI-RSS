const { MongoClient } = require('mongodb');
const { cosineSimilarity } = require('./cosine');
const Job = require('./job.model');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'resumeParserDB';

async function debugMatching() {
  let client;
  
  try {
    console.log('🔍 Debugging Resume-Job Matching Algorithm...\n');
    
    // Connect to MongoDB
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Get jobs with embeddings
    const jobs = await Job.find({ embedding: { $exists: true, $ne: [] } }).limit(1);
    if (!jobs.length) {
      console.log('❌ No jobs with embeddings found');
      return;
    }
    
    const job = jobs[0];
    console.log('📋 Testing with job:', job.title);
    console.log('Job embedding length:', job.embedding.length);
    console.log('Enhanced description preview:', job.enhancedDescription?.substring(0, 200) + '...\n');
    
    // Get resumes with embeddings
    const resumes = await db.collection('resumes').find({ embedding: { $exists: true } }).toArray();
    console.log(`📄 Found ${resumes.length} resumes with embeddings\n`);
    
    if (!resumes.length) {
      console.log('❌ No resumes with embeddings found');
      return;
    }
    
    // Extract job skills
    let jobSkills = [];
    if (job.enhancedDescription) {
      const match = job.enhancedDescription.match(/skills?:\s*([\w\s,]+)/i);
      if (match) {
        jobSkills = match[1].split(/,|\s+/).map(s => s.trim().toLowerCase()).filter(Boolean);
      }
    }
    console.log('🎯 Extracted job skills:', jobSkills);
    
    // Test matching with first few resumes
    console.log('\n📊 Testing matches:\n');
    
    const matches = resumes.slice(0, 3).map((r, index) => {
      console.log(`--- Resume ${index + 1} ---`);
      console.log('Resume embedding length:', r.embedding?.length || 'No embedding');
      console.log('Parsed resume keys:', Object.keys(r.parsedResume || {}));
      
      if (!r.embedding || !job.embedding) {
        console.log('❌ Missing embeddings');
        return null;
      }
      
      // Calculate similarity
      const score = cosineSimilarity(job.embedding, r.embedding);
      console.log('Similarity score:', score.toFixed(4));
      
      // Extract resume skills
      let resumeSkills = [];
      if (r.parsedResume && r.parsedResume.skills) {
        console.log('Raw skills data:', r.parsedResume.skills);
        console.log('Skills data type:', typeof r.parsedResume.skills);
        
        if (typeof r.parsedResume.skills === 'string') {
          resumeSkills = r.parsedResume.skills.split(/,|\s+/).map(s => s.trim().toLowerCase()).filter(Boolean);
        } else if (Array.isArray(r.parsedResume.skills)) {
          resumeSkills = r.parsedResume.skills.map(s => String(s).trim().toLowerCase()).filter(Boolean);
        } else {
          resumeSkills = String(r.parsedResume.skills).split(/,|\s+/).map(s => s.trim().toLowerCase()).filter(Boolean);
        }
      }
      
      console.log('Extracted resume skills:', resumeSkills);
      
      // Calculate skill overlap
      const skillOverlap = jobSkills.length && resumeSkills.length
        ? resumeSkills.filter(s => jobSkills.includes(s)).length
        : 0;
      
      console.log('Skill overlap count:', skillOverlap);
      console.log('Matching skills:', resumeSkills.filter(s => jobSkills.includes(s)));
      console.log('Score >= 0.5?', score >= 0.5);
      console.log('');
      
      return {
        score,
        skillOverlap,
        resume: r,
        resumeSkills,
        jobSkills
      };
    }).filter(Boolean);
    
    // Sort matches
    matches.sort((a, b) => b.score - a.score || b.skillOverlap - a.skillOverlap);
    
    console.log('🏆 Final ranking:');
    matches.forEach((match, index) => {
      console.log(`${index + 1}. Score: ${match.score.toFixed(4)}, Skill overlap: ${match.skillOverlap}`);
    });
    
    // Check for potential issues
    console.log('\n🔧 Potential Issues:');
    
    if (matches.every(m => m.score < 0.5)) {
      console.log('⚠️  All similarity scores are below 0.5 threshold');
    }
    
    if (matches.every(m => m.skillOverlap === 0)) {
      console.log('⚠️  No skill overlaps found - check skill extraction logic');
    }
    
    if (job.embedding.length !== resumes[0]?.embedding?.length) {
      console.log('⚠️  Job and resume embeddings have different dimensions');
    }
    
    console.log('\n✅ Debugging complete');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    if (client) await client.close();
  }
}

debugMatching();