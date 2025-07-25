const embeddingService = require('./embedding-service');

async function testEmbeddingGeneration() {
  console.log('🧪 Testing Embedding Generation...\n');
  
  // Test with different resume data
  const testResumes = [
    {
      name: 'John Doe',
      skills: 'JavaScript, React, Node.js',
      experience: 'Software Developer at Tech Corp',
      summary: 'Experienced frontend developer'
    },
    {
      name: 'Jane Smith', 
      skills: 'Python, Django, Machine Learning',
      experience: 'Data Scientist at AI Company',
      summary: 'Data science expert with ML background'
    },
    {
      name: 'Bob Johnson',
      skills: 'Java, Spring, Microservices',
      experience: 'Backend Engineer at Enterprise Corp',
      summary: 'Backend systems architect'
    },
    {
      name: '',
      skills: '',
      experience: '',
      summary: ''
    }
  ];
  
  try {
    for (let i = 0; i < testResumes.length; i++) {
      console.log(`--- Testing Resume ${i + 1} ---`);
      console.log('Input data:', testResumes[i]);
      
      const embedding = await embeddingService.generateResumeEmbedding(testResumes[i]);
      
      console.log('Generated embedding length:', embedding.length);
      console.log('First 10 values:', embedding.slice(0, 10));
      console.log('Embedding stats:');
      console.log('  - Min:', Math.min(...embedding));
      console.log('  - Max:', Math.max(...embedding));
      console.log('  - Average:', (embedding.reduce((a, b) => a + b, 0) / embedding.length).toFixed(6));
      console.log('  - All zeros?', embedding.every(val => Math.abs(val) < 0.001));
      console.log('');
    }
    
    // Test if different inputs produce different embeddings
    console.log('🔍 Comparing embeddings...');
    const embedding1 = await embeddingService.generateResumeEmbedding(testResumes[0]);
    const embedding2 = await embeddingService.generateResumeEmbedding(testResumes[1]);
    
    const identical = embedding1.every((val, idx) => Math.abs(val - embedding2[idx]) < 0.0001);
    console.log('First two embeddings identical?', identical);
    
    if (identical) {
      console.log('🚨 PROBLEM: Different resume data produces identical embeddings!');
    } else {
      console.log('✅ Good: Different resume data produces different embeddings');
    }
    
  } catch (error) {
    console.error('❌ Embedding generation test failed:', error);
  }
}

testEmbeddingGeneration();