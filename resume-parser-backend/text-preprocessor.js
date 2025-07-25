/**
 * Text preprocessing service for resume and job description matching
 * Handles cleaning, normalization, and standardization of text data
 */

class TextPreprocessor {
  constructor() {
    // Common skill mappings and standardizations
    this.skillMappings = {
      // Programming Languages
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'c++': 'cpp',
      'c#': 'csharp',
      '.net': 'dotnet',
      'golang': 'go',
      
      // Frameworks & Libraries
      'react.js': 'react',
      'vue.js': 'vue',
      'angular.js': 'angular',
      'node.js': 'nodejs',
      'express.js': 'express',
      'next.js': 'nextjs',
      'nuxt.js': 'nuxtjs',
      
      // Databases
      'mongodb': 'mongo',
      'postgresql': 'postgres',
      'mysql': 'mysql',
      'sqlite': 'sqlite',
      'redis': 'redis',
      
      // Cloud & DevOps
      'amazon web services': 'aws',
      'google cloud platform': 'gcp',
      'microsoft azure': 'azure',
      'docker': 'docker',
      'kubernetes': 'k8s',
      'jenkins': 'jenkins',
      
      // Tools & Technologies
      'github': 'git',
      'gitlab': 'git',
      'bitbucket': 'git',
      'visual studio code': 'vscode',
      'intellij': 'intellij',
      'photoshop': 'photoshop',
      'illustrator': 'illustrator',
      
      // Methodologies
      'agile': 'agile',
      'scrum': 'scrum',
      'kanban': 'kanban',
      'devops': 'devops',
      'ci/cd': 'cicd',
      'continuous integration': 'cicd',
      'continuous deployment': 'cicd'
    };

    // Experience level mappings
    this.experienceMappings = {
      'yrs': 'years',
      'yr': 'year',
      'mos': 'months',
      'mo': 'month',
      'junior': 'junior',
      'senior': 'senior',
      'lead': 'lead',
      'principal': 'principal',
      'staff': 'staff',
      'entry level': 'entry-level',
      'mid level': 'mid-level',
      'senior level': 'senior-level'
    };

    // Education mappings
    this.educationMappings = {
      'bs': 'bachelor of science',
      'ba': 'bachelor of arts',
      'ms': 'master of science',
      'ma': 'master of arts',
      'mba': 'master of business administration',
      'phd': 'doctor of philosophy',
      'btech': 'bachelor of technology',
      'mtech': 'master of technology',
      'bsc': 'bachelor of science',
      'msc': 'master of science',
      'be': 'bachelor of engineering',
      'me': 'master of engineering'
    };

    // Common stopwords for technical content (more selective than general stopwords)
    this.technicalStopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'very', 'really', 'quite', 'just', 'only', 'also', 'even', 'still', 'well', 'much', 'many'
    ]);
  }

  /**
   * Main preprocessing function for any text
   * @param {string} text - Raw text to preprocess
   * @param {string} type - Type of text ('resume' or 'job')
   * @returns {string} - Preprocessed text
   */
  preprocess(text, type = 'general') {
    if (!text || typeof text !== 'string') return '';

    let processedText = text;

    // Step 1: Basic cleaning
    processedText = this.basicClean(processedText);

    // Step 2: Normalize whitespace and formatting
    processedText = this.normalizeWhitespace(processedText);

    // Step 3: Standardize technical terms
    processedText = this.standardizeTechnicalTerms(processedText);

    // Step 4: Normalize experience mentions
    processedText = this.normalizeExperience(processedText);

    // Step 5: Normalize education terms
    processedText = this.normalizeEducation(processedText);

    // Step 6: Type-specific processing
    if (type === 'resume') {
      processedText = this.processResumeSpecific(processedText);
    } else if (type === 'job') {
      processedText = this.processJobSpecific(processedText);
    }

    // Step 7: Final cleanup
    processedText = this.finalCleanup(processedText);

    return processedText;
  }

  /**
   * Basic text cleaning - remove special characters, fix encoding issues
   */
  basicClean(text) {
    return text
      // Remove or replace special characters
      .replace(/[^\w\s\-\.\/\+\#]/g, ' ')
      // Fix common encoding issues
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      // Remove extra punctuation
      .replace(/\.{2,}/g, '.')
      .replace(/\-{2,}/g, '-')
      // Convert to lowercase for processing
      .toLowerCase();
  }

  /**
   * Normalize whitespace and formatting
   */
  normalizeWhitespace(text) {
    return text
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
      // Normalize line breaks
      .replace(/\n\s*\n/g, '\n')
      // Remove tabs
      .replace(/\t/g, ' ');
  }

  /**
   * Standardize technical terms and skills
   */
  standardizeTechnicalTerms(text) {
    let processedText = text;

    // Apply skill mappings
    Object.entries(this.skillMappings).forEach(([original, standardized]) => {
      const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      processedText = processedText.replace(regex, standardized);
    });

    // Standardize version numbers (e.g., "React 18" → "React")
    processedText = processedText.replace(/\b(\w+)\s+\d+(\.\d+)*\b/g, '$1');

    // Standardize framework mentions
    processedText = processedText.replace(/\b(\w+)\.js\b/g, '$1');
    processedText = processedText.replace(/\b(\w+)\.py\b/g, '$1');

    return processedText;
  }

  /**
   * Normalize experience mentions
   */
  normalizeExperience(text) {
    let processedText = text;

    // Apply experience mappings
    Object.entries(this.experienceMappings).forEach(([original, standardized]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      processedText = processedText.replace(regex, standardized);
    });

    // Normalize experience patterns
    processedText = processedText.replace(/(\d+)\+?\s*(years?|yrs?)\s*(of\s*)?(experience|exp)/gi, '$1 years experience');
    processedText = processedText.replace(/(\d+)\-(\d+)\s*(years?|yrs?)/gi, '$1-$2 years');

    return processedText;
  }

  /**
   * Normalize education terms
   */
  normalizeEducation(text) {
    let processedText = text;

    // Apply education mappings
    Object.entries(this.educationMappings).forEach(([original, standardized]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      processedText = processedText.replace(regex, standardized);
    });

    return processedText;
  }

  /**
   * Resume-specific processing
   */
  processResumeSpecific(text) {
    let processedText = text;

    // Standardize job titles
    processedText = processedText.replace(/\bsr\.?\s+/gi, 'senior ');
    processedText = processedText.replace(/\bjr\.?\s+/gi, 'junior ');
    processedText = processedText.replace(/\bdev\b/gi, 'developer');
    processedText = processedText.replace(/\beng\b/gi, 'engineer');
    processedText = processedText.replace(/\bmgr\b/gi, 'manager');

    // Normalize company types
    processedText = processedText.replace(/\binc\.?\b/gi, 'incorporated');
    processedText = processedText.replace(/\bllc\.?\b/gi, 'limited liability company');
    processedText = processedText.replace(/\bcorp\.?\b/gi, 'corporation');

    return processedText;
  }

  /**
   * Job description specific processing
   */
  processJobSpecific(text) {
    let processedText = text;

    // Normalize requirement language
    processedText = processedText.replace(/\bmust\s+have\b/gi, 'required');
    processedText = processedText.replace(/\bshould\s+have\b/gi, 'preferred');
    processedText = processedText.replace(/\bnice\s+to\s+have\b/gi, 'preferred');
    processedText = processedText.replace(/\brequired:\s*/gi, 'required ');
    processedText = processedText.replace(/\bpreferred:\s*/gi, 'preferred ');

    // Normalize benefit mentions
    processedText = processedText.replace(/\bhealth\s+insurance\b/gi, 'health benefits');
    processedText = processedText.replace(/\b401k\b/gi, 'retirement benefits');
    processedText = processedText.replace(/\bpto\b/gi, 'paid time off');

    return processedText;
  }

  /**
   * Final cleanup and optimization
   */
  finalCleanup(text) {
    if (!text) return '';
    
    return text
      // Remove remaining extra spaces
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Extract and standardize skills from text
   * @param {string} text - Text to extract skills from
   * @returns {string[]} - Array of standardized skills
   */
  extractSkills(text) {
    const processedText = this.preprocess(text);
    const skills = new Set();

    // Look for skill patterns
    Object.values(this.skillMappings).forEach(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      if (regex.test(processedText)) {
        skills.add(skill);
      }
    });

    return Array.from(skills);
  }

  /**
   * Preprocess resume data
   * @param {Object} resumeData - Parsed resume object
   * @returns {Object} - Preprocessed resume data
   */
  preprocessResume(resumeData) {
    const processed = { ...resumeData };

    if (processed.name) {
      processed.name = this.preprocess(processed.name, 'resume');
    }
    if (processed.summary) {
      processed.summary = this.preprocess(processed.summary, 'resume');
    }
    if (processed.skills) {
      processed.skills = this.preprocess(processed.skills, 'resume');
    }
    if (processed.experience) {
      processed.experience = this.preprocess(processed.experience, 'resume');
    }
    if (processed.education) {
      processed.education = this.preprocess(processed.education, 'resume');
    }
    if (processed.projects) {
      processed.projects = this.preprocess(processed.projects, 'resume');
    }

    return processed;
  }

  /**
   * Preprocess job description
   * @param {string} title - Job title
   * @param {string} description - Job description
   * @returns {Object} - Preprocessed job data
   */
  preprocessJob(title, description) {
    return {
      title: this.preprocess(title, 'job'),
      description: this.preprocess(description, 'job')
    };
  }
}

module.exports = new TextPreprocessor();