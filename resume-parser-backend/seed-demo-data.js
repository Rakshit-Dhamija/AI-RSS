/**
 * Seed demo data for POC presentation
 * Run this script to populate your database with sample data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { demoJobs, demoResumes } = require('./demo-data');
const Job = require('./job.model');
const User = require('./user.model');
const bcrypt = require('bcrypt');

async function seedDemoData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_parser');
    console.log('✅ Connected to MongoDB');

    // Create demo user (recruiter)
    const existingUser = await User.findOne({ email: 'demo@recruiter.com' });
    let demoUser;
    
    if (!existingUser) {
      const passwordHash = await bcrypt.hash('demo123', 10);
      demoUser = new User({
        email: 'demo@recruiter.com',
        passwordHash,
        role: 'job_poster',
        name: 'Demo Recruiter'
      });
      await demoUser.save();
      console.log('✅ Created demo recruiter account');
    } else {
      demoUser = existingUser;
      console.log('✅ Demo recruiter account already exists');
    }

    // Clear existing demo jobs
    await Job.deleteMany({ title: { $in: demoJobs.map(j => j.title) } });

    // Create demo jobs
    for (const jobData of demoJobs) {
      const job = new Job({
        ...jobData,
        createdBy: demoUser._id,
        embedding: Array(384).fill(0).map(() => Math.random() * 0.1 + 0.4) // Simulated embedding
      });
      await job.save();
    }
    console.log('✅ Created demo jobs');

    // Create demo resumes in raw MongoDB collection
    const db = mongoose.connection.db;
    await db.collection('resumes').deleteMany({
      'parsedResume.name': { $in: demoResumes.map(r => r.parsedResume.name) }
    });
    
    await db.collection('resumes').insertMany(demoResumes);
    console.log('✅ Created demo resumes');

    console.log('\n🎉 Demo data seeded successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('Email: demo@recruiter.com');
    console.log('Password: demo123');
    console.log('\nYour demo is ready! 🚀');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };