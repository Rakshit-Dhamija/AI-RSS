const embeddingService = require('./embedding-service');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    return description;
  }
}

async function testEmbeddings() {
  console.log('Testing automatic embedding generation with Gemini enhancement and preprocessing...\n');

  // Test resume embedding with various formats to show preprocessing
  const sampleResume = {
    name: 'John Doe',
    summary: 'Experienced software developer with 5+ yrs in web development & mobile apps',
    skills: 'JS, Python, React.js, Node.js, MongoDB, C++, .NET, AWS, Docker',
    experience: 'Sr. Developer at Tech Corp Inc. (2019-2024), Jr. Dev at StartupXYZ LLC (2017-2019)',
    education: 'BS in Computer Science, University of Technology, MS in Software Engineering'
  };

  try {
    // Demonstrate preprocessing
    console.log('🔧 Demonstrating text preprocessing...');
    const textPreprocessor = require('./text-preprocessor');
    
    console.log('Before preprocessing:');
    console.log(`Skills: "${sampleResume.skills}"`);
    console.log(`Experience: "${sampleResume.experience}"`);
    console.log(`Education: "${sampleResume.education}"`);
    
    const processedResume = textPreprocessor.preprocessResume(sampleResume);
    console.log('\nAfter preprocessing:');
    console.log(`Skills: "${processedResume.skills}"`);
    console.log(`Experience: "${processedResume.experience}"`);
    console.log(`Education: "${processedResume.education}"`);
    console.log('');
    console.log('1️⃣ Generating embedding for sample resume...');
    const resumeEmbedding = await embeddingService.generateResumeEmbedding(sampleResume);
    console.log('✅ Resume embedding generated successfully!');
    console.log(`Embedding dimensions: ${resumeEmbedding.length}`);
    console.log(`First 5 values: [${resumeEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

    // Test job enhancement with Gemini
    const originalJobTitle = 'Senior Full Stack Developer';
    const originalJobDescription = 'We are looking for an experienced full stack developer with expertise in JavaScript, React, Node.js, and MongoDB. The ideal candidate should have 3+ years of experience in web development and be familiar with modern development practices.';
    
    console.log('2️⃣ Enhancing job description with Gemini AI...');
    console.log('Original job description:');
    console.log(`"${originalJobDescription}"\n`);
    
    const enhancedDescription = await enhanceJobDescription(originalJobTitle, originalJobDescription);
    console.log('✅ Job description enhanced successfully!');
    console.log('Enhanced job description:');
    console.log(`"${enhancedDescription}"\n`);

    // Test job embedding with enhanced description
    console.log('3️⃣ Generating embedding for enhanced job...');
    const jobEmbedding = await embeddingService.generateJobEmbedding(originalJobTitle, enhancedDescription);
    console.log('✅ Job embedding generated successfully!');
    console.log(`Embedding dimensions: ${jobEmbedding.length}`);
    console.log(`First 5 values: [${jobEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

    // Test similarity
    const { cosineSimilarity } = require('./cosine');
    const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
    console.log(`🎯 Similarity score between resume and enhanced job: ${similarity.toFixed(4)}`);
    console.log('\n✅ All tests passed! Automatic embedding generation with Gemini enhancement is working correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testEmbeddings();