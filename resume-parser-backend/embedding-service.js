const { spawn } = require('child_process');
const path = require('path');

/**
 * Simple Embedding Service for POC
 */
class EmbeddingService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.timeout = 30000;
    this.embeddingCache = new Map();
  }

  /**
   * Generate cache key for text
   */
  getCacheKey(text) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Generate embedding for a given text
   * @param {string} text - Text to generate embedding for
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      console.log('✅ Cache hit for embedding');
      return this.embeddingCache.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'generate_embedding.py');
      const python = spawn(this.pythonPath, [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
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
          reject(new Error(`Python script failed (code ${code}): ${error}`));
          return;
        }
        
        try {
          const embedding = JSON.parse(output.trim());
          this.embeddingCache.set(cacheKey, embedding);
          resolve(embedding);
        } catch (parseError) {
          reject(new Error(`Failed to parse embedding: ${parseError.message}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });

      // Handle timeout
      const timeoutId = setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error('Embedding generation timed out'));
      }, this.timeout);

      python.on('close', () => {
        clearTimeout(timeoutId);
      });

      // Send text to Python script
      try {
        python.stdin.write(text);
        python.stdin.end();
      } catch (writeError) {
        reject(new Error(`Failed to write to Python process: ${writeError.message}`));
      }
    });
  }

  /**
   * Generate embedding for resume data
   * @param {Object} resumeData - Parsed resume object
   * @returns {Promise<number[]>} - Array of embedding values
   */
  async generateResumeEmbedding(resumeData) {
    const textParts = [];
    
    if (resumeData.name) textParts.push(`Name: ${resumeData.name}`);
    if (resumeData.summary) textParts.push(`Summary: ${resumeData.summary}`);
    if (resumeData.skills) textParts.push(`Skills: ${resumeData.skills}`);
    if (resumeData.experience) textParts.push(`Experience: ${resumeData.experience}`);
    if (resumeData.education) textParts.push(`Education: ${resumeData.education}`);
    if (resumeData.projects) textParts.push(`Projects: ${resumeData.projects}`);
    
    const combinedText = textParts.join('\n');
    
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
    const combinedText = `Title: ${title}\nDescription: ${description}`;
    
    if (!combinedText || combinedText.trim().length === 0) {
      throw new Error('No job text content available for embedding generation');
    }
    
    return this.generateEmbedding(combinedText);
  }
}

module.exports = new EmbeddingService();