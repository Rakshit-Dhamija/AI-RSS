require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { parseResumeFromPdf } = require('./parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user.model');
const jwt = require('jsonwebtoken');

const Job = require('./job.model');
const embeddingService = require('./embedding-service');
const path = require('path');

// Add JWT_SECRET definition at the top
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Import Google Generative AI for job enhancement
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Calculate quality score for a specific field (0-1 scale)
 */
function calculateFieldQuality(fieldValue, fieldType) {
  if (!fieldValue) return 0;

  let text = '';
  if (typeof fieldValue === 'string') {
    text = fieldValue.trim();
  } else if (typeof fieldValue === 'object') {
    // Handle complex objects like skills
    if (fieldValue.featuredSkills && Array.isArray(fieldValue.featuredSkills)) {
      text = fieldValue.featuredSkills.map(s => s.skill || '').join(' ');
    }
    if (fieldValue.descriptions && Array.isArray(fieldValue.descriptions)) {
      text += ' ' + fieldValue.descriptions.join(' ');
    }
    text = text.trim();
  } else {
    text = String(fieldValue).trim();
  }

  if (!text || text.length === 0) return 0;

  // Base score based on content length (more lenient)
  let score = Math.min(text.length / 50, 1.0); // Max score at 50+ characters (reduced from 100)

  // Field-specific quality adjustments (more lenient)
  switch (fieldType) {
    case 'name':
      // Names should be 2-50 characters
      if (text.length >= 2 && text.length <= 50) score = 1.0;
      else if (text.length > 50) score = 0.8;
      else if (text.length >= 1) score = 0.6; // More lenient for short names
      else score = 0.0;
      break;

    case 'skills':
      // Skills should have multiple items (more lenient)
      const skillCount = text.split(/[,;|\n]/).filter(s => s.trim().length > 0).length;
      if (skillCount >= 3) score = 1.0;
      else if (skillCount >= 2) score = 0.8;
      else if (skillCount >= 1) score = 0.5; // Give credit for having any skills
      else score = 0.0;
      break;

    case 'experience':
      // Experience should be detailed (more lenient)
      const wordCount = text.split(/\s+/).length;
      if (wordCount >= 20) score = 1.0;
      else if (wordCount >= 10) score = 0.8;
      else if (wordCount >= 5) score = 0.6;
      else if (wordCount >= 1) score = 0.4; // Give credit for any experience
      else score = 0.0;
      break;

    case 'summary':
      // Summary should be substantial but not too long
      const summaryWords = text.split(/\s+/).length;
      if (summaryWords >= 20 && summaryWords <= 100) score = 1.0;
      else if (summaryWords >= 10) score = 0.8;
      else if (summaryWords >= 5) score = 0.5;
      else score = 0.3;
      break;

    case 'education':
      // Education should mention degree/institution
      if (text.toLowerCase().includes('bachelor') || text.toLowerCase().includes('master') ||
        text.toLowerCase().includes('degree') || text.toLowerCase().includes('university')) {
        score = Math.min(score * 1.2, 1.0);
      }
      break;

    case 'projects':
      // Projects should be detailed
      const projectWords = text.split(/\s+/).length;
      score = Math.min(projectWords / 30, 1.0); // Max score at 30+ words
      break;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate quality score for work experience array
 */
function calculateWorkExperienceQuality(workExperiences) {
  if (!Array.isArray(workExperiences) || workExperiences.length === 0) return 0;

  let totalScore = 0;
  let validEntries = 0;

  for (const work of workExperiences) {
    if (!work) continue;

    let entryScore = 0;

    // Check for company name
    if (work.company && work.company.trim()) entryScore += 0.3;

    // Check for job title
    if (work.jobTitle && work.jobTitle.trim()) entryScore += 0.3;

    // Check for dates
    if (work.date && work.date.trim()) entryScore += 0.2;

    // Check for descriptions
    if (work.descriptions && Array.isArray(work.descriptions) && work.descriptions.length > 0) {
      const descText = work.descriptions.join(' ').trim();
      if (descText.length > 50) entryScore += 0.2;
      else if (descText.length > 0) entryScore += 0.1;
    }

    totalScore += entryScore;
    validEntries++;
  }

  return validEntries > 0 ? Math.min(totalScore / validEntries, 1.0) : 0;
}

/**
 * Calculate quality score for education array
 */
function calculateEducationDetailQuality(educations) {
  if (!Array.isArray(educations) || educations.length === 0) return 0;

  let totalScore = 0;
  let validEntries = 0;

  for (const edu of educations) {
    if (!edu) continue;

    let entryScore = 0;

    // Check for school name
    if (edu.school && edu.school.trim()) entryScore += 0.4;

    // Check for degree
    if (edu.degree && edu.degree.trim()) entryScore += 0.4;

    // Check for GPA
    if (edu.gpa && edu.gpa.trim()) entryScore += 0.1;

    // Check for date
    if (edu.date && edu.date.trim()) entryScore += 0.1;

    totalScore += entryScore;
    validEntries++;
  }

  return validEntries > 0 ? Math.min(totalScore / validEntries, 1.0) : 0;
}

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

// Enhanced CORS configuration for POC
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.post('/ai-summary', async (req, res) => {
  try {
    const resume = req.body.resume;
    if (!resume) {
      return res.status(400).json({ error: 'No resume provided.' });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert recruiter. Read the following candidate resume and write a concise, insightful summary of their professional background, key skills, and suitability for data science or technical roles. Highlight strengths, unique experiences, and any red flags.\n\nResume:\n${JSON.stringify(resume, null, 2)}\n\nSummary:`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ summary: response.text() });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ error: 'Failed to generate AI summary.' });
  }
});

// Simple, working MongoDB connection (reverted from complex database manager)
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_parser', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('Please check:');
    console.log('1. Your internet connection');
    console.log('2. MongoDB Atlas IP whitelist settings');
    console.log('3. Database credentials in .env file');
    return false;
  }
}

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

  try {
    // Use the advanced parsing logic
    const parsedResume = await parseResumeFromPdf(fs.readFileSync(req.file.path));
    fs.unlinkSync(req.file.path);

    // Generate embedding for the parsed resume
    console.log('Generating embedding for resume...');
    const embedding = await embeddingService.generateResumeEmbedding(parsedResume);
    console.log('Embedding generated successfully');

    // Use simple MongoDB connection (same as before)
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('resumeParserDB');
    const result = await db.collection('resumes').insertOne({
      parsedResume: parsedResume,
      embedding: embedding,
      uploadedAt: new Date(),
      filePath: req.file.path, // Save the file path
    });
    await client.close();

    res.json({ parsedResume: parsedResume, mongoId: result.insertedId });
  } catch (err) {
    console.error('Error parsing resume or generating embedding:', err);
    res.status(500).json({ error: 'Failed to parse or store PDF', details: err.stack || err.message });
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

// Middleware to verify JWT and extract user info with better debugging
function authenticateJWT(req, res, next) {
  console.log('🔐 JWT Auth - Headers:', req.headers.authorization ? 'Present' : 'Missing');

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('❌ JWT Auth - No authorization header');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('❌ JWT Auth - No token in header');
    return res.status(401).json({ error: 'No token provided' });
  }

  console.log('🔍 JWT Auth - Token present, verifying...');
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ JWT Auth - Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid token', details: err.message });
    }

    console.log('✅ JWT Auth - Token valid for user:', user.userId, 'role:', user.role);
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
  try {
    const jobId = req.params.jobId;

    // Find job using Mongoose
    const job = await Job.findById(jobId);
    if (!job || !job.embedding || job.embedding.length === 0) {
      return res.status(404).json({ error: 'Job or job embedding not found.' });
    }

    // Use simple MongoDB connection (same as before)
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('resumeParserDB');
    const resumes = await db.collection('resumes').find({ embedding: { $exists: true } }).toArray();
    await client.close();
    if (!resumes.length) {
      return res.status(404).json({ error: 'No resumes with embeddings found.' });
    }

    // Extract job skills from multiple sources (RESTORED ORIGINAL SUPERIOR LOGIC)
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

    // Fallback to universal skills if no skills found (ENHANCED FOR ALL INDUSTRIES)
    if (jobSkills.length === 0 && job.description) {
      const universalSkills = [
        // Tech Skills
        'javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css', 'aws', 'docker', 'git',
        // Business Skills  
        'management', 'leadership', 'communication', 'teamwork', 'project management', 'analysis',
        // Healthcare Skills
        'nursing', 'patient care', 'medical', 'healthcare', 'clinical', 'emergency', 'treatment',
        // Finance Skills
        'accounting', 'finance', 'investment', 'banking', 'audit', 'excel', 'financial analysis',
        // Education Skills
        'teaching', 'curriculum', 'education', 'training', 'classroom management', 'assessment',
        // Marketing Skills
        'marketing', 'seo', 'social media', 'branding', 'analytics', 'campaign management'
      ];
      jobSkills = universalSkills.filter(skill =>
        job.description.toLowerCase().includes(skill)
      );
    }

    // Remove duplicates and clean up
    jobSkills = [...new Set(jobSkills)].filter(Boolean);

    console.log('Extracted job skills:', jobSkills);

    const matches = resumes.map(r => {
      // Check if resume has meaningful content
      const parsed = r.parsedResume || {};
      // Try multiple name field possibilities
      const possibleName = parsed.name || parsed.profile?.name || parsed.personalInfo?.name || parsed.header?.name;

      // Enhanced content quality scoring (0-1) - RESTORED ORIGINAL SUPERIOR LOGIC
      const nameScore = calculateFieldQuality(possibleName, 'name');
      const skillsScore = calculateFieldQuality(parsed.skills, 'skills');
      const experienceScore = calculateFieldQuality(parsed.experience, 'experience');
      const summaryScore = calculateFieldQuality(parsed.summary, 'summary');
      const educationScore = calculateFieldQuality(parsed.education, 'education');

      // Additional quality factors - RESTORED ORIGINAL
      const workExperienceScore = calculateWorkExperienceQuality(parsed.workExperiences);
      const educationDetailScore = calculateEducationDetailQuality(parsed.educations);
      const projectsScore = calculateFieldQuality(parsed.projects, 'projects');

      // Weighted content score (different fields have different importance) - RESTORED ORIGINAL
      const contentScore = (
        nameScore * 0.1 +           // 10% - Basic info
        skillsScore * 0.3 +         // 30% - Very important
        experienceScore * 0.2 +     // 20% - Important
        summaryScore * 0.15 +       // 15% - Good to have
        educationScore * 0.1 +      // 10% - Basic requirement
        workExperienceScore * 0.1 + // 10% - Detailed work history
        educationDetailScore * 0.03 + // 3% - Detailed education
        projectsScore * 0.02        // 2% - Shows initiative
      );

      // Skip resumes with no meaningful content (lowered threshold)
      if (contentScore < 0.1) { // Less than 10% content
        console.log('Skipping empty/incomplete resume:', possibleName || 'Unnamed');
        return null;
      }

      // Calculate embedding similarity - RESTORED ORIGINAL
      let embeddingScore = 0;
      if (r.embedding && job.embedding && r.embedding.length === job.embedding.length) {
        try {
          // Check for zero/near-zero embeddings (indicates empty content)
          const isZeroEmbedding = r.embedding.every(val => Math.abs(val) < 0.001);
          if (isZeroEmbedding) {
            console.log('Skipping resume with zero embedding:', parsed.name || 'Unnamed');
            return null;
          }

          const { cosineSimilarity } = require('./cosine');
          embeddingScore = cosineSimilarity(job.embedding, r.embedding);
        } catch (error) {
          console.warn('Cosine similarity calculation failed:', error.message);
          embeddingScore = 0;
        }
      }

      // Extract resume skills from multiple possible fields - RESTORED ORIGINAL COMPLEX LOGIC
      let resumeSkills = [];
      const skillSources = [
        r.parsedResume?.skills,
        r.parsedResume?.skills?.featuredSkills,
        r.parsedResume?.skills?.descriptions,
        r.parsedResume?.technicalSkills,
        r.parsedResume?.technologies
      ].filter(Boolean);

      for (const skillSource of skillSources) {
        try {
          if (typeof skillSource === 'string') {
            const extracted = skillSource
              .split(/[,\n\r\-•|]/)
              .map(s => s.trim().toLowerCase())
              .filter(s => s.length > 1 && s.length < 30);
            resumeSkills.push(...extracted);
          } else if (Array.isArray(skillSource)) {
            const extracted = skillSource
              .map(s => {
                if (typeof s === 'object' && s.skill) {
                  // Extract skill text and split by common delimiters
                  return s.skill.split(/[,;:|]/).map(skill => skill.trim()).filter(Boolean);
                }
                return String(s);
              })
              .flat() // Flatten in case we got arrays from splitting
              .map(s => s.trim().toLowerCase())
              .filter(s => s.length > 1 && s.length < 50 && s !== '[object object]');
            resumeSkills.push(...extracted);
          } else if (typeof skillSource === 'object') {
            // Handle nested skill objects
            const extracted = Object.values(skillSource)
              .flat()
              .map(s => String(s).trim().toLowerCase())
              .filter(s => s.length > 1 && s.length < 30);
            resumeSkills.push(...extracted);
          }
        } catch (error) {
          console.warn('Resume skill extraction failed for source:', error.message);
        }
      }

      // Remove duplicates and clean up
      resumeSkills = [...new Set(resumeSkills)].filter(Boolean);

      // Calculate skill overlap with fuzzy matching - RESTORED ORIGINAL SOPHISTICATED LOGIC
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
            // Partial match (contains) - check both directions
            else if (jobSkill.includes(resumeSkill) || resumeSkill.includes(jobSkill)) {
              skillOverlap += 0.5;
              matchingSkills.push(`${jobSkill}~${resumeSkill}`);
            }
            // Special case: check if job skill appears anywhere in resume skill text
            else if (resumeSkill.includes(jobSkill)) {
              skillOverlap += 0.8; // High score for finding the skill within text
              matchingSkills.push(`${jobSkill} (found in: ${resumeSkill})`);
            }
            // Additional check: split resume skills by common separators and check each part
            else {
              const resumeSkillParts = resumeSkill.split(/[,;:|\/\s]+/).map(part => part.trim().toLowerCase()).filter(Boolean);
              for (const part of resumeSkillParts) {
                if (part === jobSkill || part.includes(jobSkill) || jobSkill.includes(part)) {
                  skillOverlap += 0.9; // Very high score for exact match in parts
                  matchingSkills.push(`${jobSkill} (matched: ${part})`);
                  break; // Only count once per job skill
                }
              }
            }
          }
        }
      }

      // Calculate composite score with content quality weighting - RESTORED ORIGINAL
      const normalizedSkillScore = jobSkills.length > 0 ? skillOverlap / jobSkills.length : 0;

      // Weight the final score by content completeness and embedding quality
      const baseScore = (embeddingScore * 0.6) + (normalizedSkillScore * 0.3) + (contentScore * 0.1);

      // Apply minimum thresholds (more lenient)
      if (baseScore < 0.05 || contentScore < 0.1) {
        console.log(`Filtering out ${possibleName || 'Unnamed'}: baseScore=${baseScore.toFixed(4)}, contentScore=${contentScore.toFixed(4)}`);
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
  }
});

app.get('/resumes/:id/file', async (req, res) => {
  const { id } = req.params;
  // Fetch the resume document from MongoDB
  const { MongoClient, ObjectId } = require('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('resumeParserDB');
  const resumeDoc = await db.collection('resumes').findOne({ _id: new ObjectId(id) });
  await client.close();

  if (!resumeDoc || !resumeDoc.filePath) {
    return res.status(404).json({ error: 'Resume file not found.' });
  }
  const filePath = path.resolve(resumeDoc.filePath);
  res.sendFile(filePath);
});

// Start server only after MongoDB connection is established
async function startServer() {
  const connected = await connectToMongoDB();

  if (!connected) {
    console.error('❌ Failed to connect to MongoDB. Server not started.');
    console.log('💡 Try running: node test-connection.js to diagnose the issue');
    process.exit(1);
  }

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening on port ${PORT}`);
    console.log('✅ Server ready to accept requests');
  });
}

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 