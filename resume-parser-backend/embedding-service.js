const { spawn } = require('child_process');
const path = require('path');
const textPreprocessor = require('./text-preprocessor');

/**
 * Service to generate embeddings using Python SentenceTransformers
 */
class EmbeddingService {
  constructor() {
    // Use Python from the venv directory
    this.pythonPath = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe'); // Windows
    // For Linux/Mac, it would be: path.join(__dirname, '..', 'venv', 'bin', 'python')
  }

  /**
   * Generate embedding for a given text
   * @param {string} text - Text to generate embedding for
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generateEmbedding(text) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'generate_embedding.py');
      const python = spawn(this.pythonPath, [pythonScript]);
      
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${error}`));
          return;
        }
        
        try {
          const embedding = JSON.parse(output.trim());
          resolve(embedding);
        } catch (parseError) {
          reject(new Error(`Failed to parse embedding: ${parseError.message}`));
        }
      });

      // Send text to Python script
      python.stdin.write(text);
      python.stdin.end();
    });
  }

  /**
   * Generate embedding for resume data
   * @param {Object} resumeData - Parsed resume object
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generateResumeEmbedding(resumeData) {
    console.log('Original resume data:', JSON.stringify(resumeData, null, 2));
    
    // Try preprocessing first
    let processedResume;
    try {
      processedResume = textPreprocessor.preprocessResume(resumeData);
      console.log('Processed resume data:', JSON.stringify(processedResume, null, 2));
    } catch (error) {
      console.warn('Preprocessing failed, using original data:', error.message);
      processedResume = resumeData;
    }
    
    // Combine relevant resume fields into a single text
    const textParts = [];
    
    if (processedResume.name) textParts.push(`Name: ${processedResume.name}`);
    if (processedResume.summary) textParts.push(`Summary: ${processedResume.summary}`);
    if (processedResume.skills) textParts.push(`Skills: ${processedResume.skills}`);
    if (processedResume.experience) textParts.push(`Experience: ${processedResume.experience}`);
    if (processedResume.education) textParts.push(`Education: ${processedResume.education}`);
    if (processedResume.projects) textParts.push(`Projects: ${processedResume.projects}`);
    
    let combinedText = textParts.join('\n');
    console.log('Combined text length:', combinedText.length);
    console.log('Combined text preview:', combinedText.substring(0, 300));
    
    // Fallback to original data if processed text is empty
    if (!combinedText || combinedText.trim().length === 0) {
      console.warn('Processed text is empty, falling back to original data');
      const fallbackParts = [];
      if (resumeData.name) fallbackParts.push(`Name: ${resumeData.name}`);
      if (resumeData.summary) fallbackParts.push(`Summary: ${resumeData.summary}`);
      if (resumeData.skills) fallbackParts.push(`Skills: ${resumeData.skills}`);
      if (resumeData.experience) fallbackParts.push(`Experience: ${resumeData.experience}`);
      if (resumeData.education) fallbackParts.push(`Education: ${resumeData.education}`);
      if (resumeData.projects) fallbackParts.push(`Projects: ${resumeData.projects}`);
      
      combinedText = fallbackParts.join('\n');
    }
    
    if (!combinedText || combinedText.trim().length === 0) {
      throw new Error('No text content available for embedding generation');
    }
    
    return this.generateEmbedding(combinedText);
  }

  /**
   * Generate embedding for job description
   * @param {string} title - Job title
   * @param {string} description - Job description
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generateJobEmbedding(title, description) {
    console.log('Original job data:', { title, description });
    
    // Try preprocessing first
    let processedJob;
    try {
      processedJob = textPreprocessor.preprocessJob(title, description);
      console.log('Processed job data:', processedJob);
    } catch (error) {
      console.warn('Job preprocessing failed, using original data:', error.message);
      processedJob = { title, description };
    }
    
    let combinedText = `Title: ${processedJob.title}\nDescription: ${processedJob.description}`;
    
    // Fallback to original data if processed text is empty
    if (!combinedText || combinedText.trim().length === 0) {
      console.warn('Processed job text is empty, falling back to original data');
      combinedText = `Title: ${title}\nDescription: ${description}`;
    }
    
    if (!combinedText || combinedText.trim().length === 0) {
      throw new Error('No job text content available for embedding generation');
    }
    
    console.log('Final job text for embedding:', combinedText.substring(0, 200) + '...');
    return this.generateEmbedding(combinedText);
  }
}

module.exports = new EmbeddingService();