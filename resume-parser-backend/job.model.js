const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, // Original description
  enhancedDescription: { type: String }, // AI-enhanced description
  embedding: { type: [Number], default: [] }, // Array of numbers for the embedding
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Job = mongoose.model('Job', JobSchema);
module.exports = Job; 