require('dotenv').config();
const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI; // Change if using Atlas or remote
const DB_NAME = 'resumeParserDB';

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parseResumeFromPdf } = require('./parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user.model');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const Job = require('./job.model');
const { cosineSimilarity } = require('./cosine');
const embeddingService = require('./embedding-service');

// Import Google Generative AI for job enhancement
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Enhance job description using Gemini AI
 */
async function enhanceJobDescription(title, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
Rewrite the following job description to clearly list all key skills, requirements, and responsibilities. 
Make it concise, well-structured, and easy to match with candidate resumes. 
Focus on extracting and organizing:
- Required technical skills
- Experience requirements
- Key responsibilities
- Qualifications

Job Title: ${title}
Job Description: ${description}

Enhanced Job Description:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error enhancing job description with Gemini:', error);
    // Fallback to original description if enhancement fails
    return description;
  }
}

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

// Connect to MongoDB with mongoose with better error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_parser', {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Socket timeout
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.log('Please check:');
  console.log('1. Your internet connection');
  console.log('2. MongoDB Atlas IP whitelist settings');
  console.log('3. Database credentials in .env file');
});

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }
    if (!['user', 'job_poster', 'admin', 'interviewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash, role, name });
    await user.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/upload', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  let client;
  try {
    // Use the advanced parsing logic
    const parsedResume = await parseResumeFromPdf(fs.readFileSync(req.file.path));
    fs.unlinkSync(req.file.path);

    // Generate embedding for the parsed resume
    console.log('Generating embedding for resume...');
    const embedding = await embeddingService.generateResumeEmbedding(parsedResume);
    console.log('Embedding generated successfully');

    // Connect to MongoDB Atlas and insert parsed data with embedding
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const result = await db.collection('resumes').insertOne({
      parsedResume: parsedResume,
      embedding: embedding,
      uploadedAt: new Date(),
    });

    res.json({ parsedResume: parsedResume, mongoId: result.insertedId });
  } catch (err) {
    console.error('Error parsing resume or generating embedding:', err);
    res.status(500).json({ error: 'Failed to parse or store PDF', details: err.stack || err.message });
  } finally {
    if (client) await client.close();
  }
});

// Login endpoint (now issues JWT directly)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Issue JWT directly
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Middleware to verify JWT and extract user info
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// POST /jobs - recruiter uploads a job description
app.post('/jobs', authenticateJWT, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    if (req.user.role !== 'recruiter' && req.user.role !== 'job_poster') {
      return res.status(403).json({ error: 'Only recruiters can post jobs.' });
    }

    // Enhance job description using Gemini AI
    console.log('Enhancing job description with Gemini AI...');
    const enhancedDescription = await enhanceJobDescription(title, description);
    console.log('Job description enhanced successfully');

    // Generate embedding for the enhanced job description
    console.log('Generating embedding for enhanced job...');
    const embedding = await embeddingService.generateJobEmbedding(title, enhancedDescription);
    console.log('Job embedding generated successfully');

    const job = new Job({
      title,
      description, // Original description
      enhancedDescription, // AI-enhanced description
      embedding,
      createdBy: req.user.userId,
    });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    console.error('Job upload error:', err);
    res.status(500).json({ error: 'Failed to upload job.' });
  }
});

// GET /jobs - recruiter fetches their own jobs
app.get('/jobs', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'job_poster') {
      return res.status(403).json({ error: 'Only recruiters can view their jobs.' });
    }
    const jobs = await Job.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
});

// GET /jobs/:jobId/match - return top 5 matching resumes for a job
app.get('/jobs/:jobId/match', async (req, res) => {
  let client;
  try {
    const jobId = req.params.jobId;
    
    // Find job using Mongoose
    const job = await Job.findById(jobId);
    if (!job || !job.embedding || job.embedding.length === 0) {
      return res.status(404).json({ error: 'Job or job embedding not found.' });
    }

    // Connect to MongoDB to get resumes
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const resumes = await db.collection('resumes').find({ embedding: { $exists: true } }).toArray();
    if (!resumes.length) {
      return res.status(404).json({ error: 'No resumes with embeddings found.' });
    }
    // Extract job skills from multiple sources
    let jobSkills = [];
    
    // Try to extract from enhanced description first
    if (job.enhancedDescription) {
      const skillPatterns = [
        /(?:required|must have|essential)[\s\S]*?skills?[:\s]*([\w\s,.-]+)/i,
        /skills?[:\s]*([\w\s,.-]+)/i,
        /technologies?[:\s]*([\w\s,.-]+)/i,
        /experience with[:\s]*([\w\s,.-]+)/i
      ];
      
      for (const pattern of skillPatterns) {
        const match = job.enhancedDescription.match(pattern);
        if (match) {
          const extractedSkills = match[1]
            .split(/[,\n\r\-•]/)
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 1 && s.length < 30)
            .slice(0, 20); // Limit to prevent noise
          jobSkills.push(...extractedSkills);
          break;
        }
      }
    }
    
    // Fallback to original description if no skills found
    if (jobSkills.length === 0 && job.description) {
      const commonTechSkills = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'git'];
      jobSkills = commonTechSkills.filter(skill => 
        job.description.toLowerCase().includes(skill)
      );
    }
    
    // Remove duplicates and clean up
    jobSkills = [...new Set(jobSkills)].filter(Boolean);
    
    console.log('Extracted job skills:', jobSkills);
    
    const matches = resumes.map(r => {
      // Check if resume has meaningful content
      const parsed = r.parsedResume || {};
      const hasName = !!(parsed.name && parsed.name.trim());
      const hasSkills = !!(parsed.skills && (
        typeof parsed.skills === 'string' ? parsed.skills.trim() :
        Array.isArray(parsed.skills) ? parsed.skills.length > 0 :
        parsed.skills.featuredSkills?.length > 0 || parsed.skills.descriptions?.length > 0
      ));
      const hasExperience = !!(parsed.experience && parsed.experience.trim());
      const hasSummary = !!(parsed.summary && parsed.summary.trim());
      const hasEducation = !!(parsed.education && parsed.education.trim());
      
      // Content completeness score (0-1)
      const contentFields = [hasName, hasSkills, hasExperience, hasSummary, hasEducation];
      const contentScore = contentFields.filter(Boolean).length / contentFields.length;
      
      // Skip resumes with no meaningful content
      if (contentScore < 0.2) { // Less than 20% content
        console.log('Skipping empty/incomplete resume:', parsed.name || 'Unnamed');
        return null;
      }
      
      // Calculate embedding similarity
      let embeddingScore = 0;
      if (r.embedding && job.embedding && r.embedding.length === job.embedding.length) {
        try {
          // Check for zero/near-zero embeddings (indicates empty content)
          const isZeroEmbedding = r.embedding.every(val => Math.abs(val) < 0.001);
          if (isZeroEmbedding) {
            console.log('Skipping resume with zero embedding:', parsed.name || 'Unnamed');
            return null;
          }
          
          embeddingScore = cosineSimilarity(job.embedding, r.embedding);
        } catch (error) {
          console.warn('Cosine similarity calculation failed:', error.message);
          embeddingScore = 0;
        }
      }
      
      // Extract resume skills
      let resumeSkills = [];
      if (r.parsedResume && r.parsedResume.skills) {
        try {
          if (typeof r.parsedResume.skills === 'string') {
            resumeSkills = r.parsedResume.skills
              .split(/[,\n\r\-•]/)
              .map(s => s.trim().toLowerCase())
              .filter(s => s.length > 1 && s.length < 30);
          } else if (Array.isArray(r.parsedResume.skills)) {
            resumeSkills = r.parsedResume.skills
              .map(s => String(s).trim().toLowerCase())
              .filter(s => s.length > 1 && s.length < 30);
          } else {
            resumeSkills = String(r.parsedResume.skills)
              .split(/[,\n\r\-•]/)
              .map(s => s.trim().toLowerCase())
              .filter(s => s.length > 1 && s.length < 30);
          }
        } catch (error) {
          console.warn('Resume skill extraction failed:', error.message);
          resumeSkills = [];
        }
      }
      
      // Calculate skill overlap with fuzzy matching
      let skillOverlap = 0;
      let matchingSkills = [];
      
      if (jobSkills.length > 0 && resumeSkills.length > 0) {
        for (const jobSkill of jobSkills) {
          for (const resumeSkill of resumeSkills) {
            // Exact match
            if (jobSkill === resumeSkill) {
              skillOverlap++;
              matchingSkills.push(jobSkill);
            }
            // Partial match (contains)
            else if (jobSkill.includes(resumeSkill) || resumeSkill.includes(jobSkill)) {
              skillOverlap += 0.5;
              matchingSkills.push(`${jobSkill}~${resumeSkill}`);
            }
          }
        }
      }
      
      // Calculate composite score with content quality weighting
      const normalizedSkillScore = jobSkills.length > 0 ? skillOverlap / jobSkills.length : 0;
      
      // Weight the final score by content completeness and embedding quality
      const baseScore = (embeddingScore * 0.6) + (normalizedSkillScore * 0.3) + (contentScore * 0.1);
      
      // Apply minimum thresholds
      if (baseScore < 0.1 || contentScore < 0.2) {
        return null;
      }
      
      // Match explanation
      let explanation = [];
      if (r.parsedResume) {
        if (r.parsedResume.skills) explanation.push('skills');
        if (r.parsedResume.experience) explanation.push('experience');
        if (r.parsedResume.summary) explanation.push('summary');
      }
      
      return {
        score: baseScore,
        embeddingScore: embeddingScore,
        contentScore: contentScore,
        skillOverlap: Math.round(skillOverlap * 10) / 10,
        matchingSkills,
        resume: r,
        explanation: explanation.slice(0, 3)
      };
    }).filter(Boolean); // Remove null entries
    matches.sort((a, b) => b.score - a.score || b.skillOverlap - a.skillOverlap);
    res.json(matches.slice(0, 5));
  } catch (err) {
    console.error('Error in /jobs/:jobId/match:', err);
    res.status(500).json({ error: 'Failed to match resumes.' });
  } finally {
    if (client) await client.close();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 