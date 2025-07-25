const { cosineSimilarity } = require('./cosine');

function testScoringComponents() {
  console.log('🧪 Testing Scoring Components (No MongoDB needed)...\n');
  
  // Test 1: Cosine Similarity Function
  console.log('1️⃣ Testing Cosine Similarity Function:');
  
  const testCases = [
    {
      name: 'Identical vectors',
      vec1: [1, 2, 3],
      vec2: [1, 2, 3],
      expected: 1.0
    },
    {
      name: 'Orthogonal vectors',
      vec1: [1, 0, 0],
      vec2: [0, 1, 0],
      expected: 0.0
    },
    {
      name: 'Opposite vectors',
      vec1: [1, 0, 0],
      vec2: [-1, 0, 0],
      expected: -1.0
    },
    {
      name: 'Similar vectors',
      vec1: [1, 1, 0],
      vec2: [1, 0.5, 0],
      expected: 0.894 // approximately
    }
  ];
  
  testCases.forEach(test => {
    try {
      const result = cosineSimilarity(test.vec1, test.vec2);
      const passed = Math.abs(result - test.expected) < 0.1;
      console.log(`  ${test.name}: ${result.toFixed(4)} (expected ~${test.expected}) ${passed ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`  ${test.name}: ERROR - ${error.message} ❌`);
    }
  });
  
  // Test 2: Simulate Resume Embeddings
  console.log('\n2️⃣ Testing with Simulated Resume Embeddings:');
  
  const jobEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5]; // Simulated job embedding
  
  const resumeEmbeddings = [
    { name: 'Resume A', embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }, // Identical to job
    { name: 'Resume B', embedding: [0.2, 0.3, 0.4, 0.5, 0.6] }, // Similar to job
    { name: 'Resume C', embedding: [0.9, 0.8, 0.7, 0.6, 0.5] }, // Different from job
    { name: 'Resume D', embedding: [0, 0, 0, 0, 0] }, // Zero embedding
    { name: 'Resume E', embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }, // Identical to Resume A
  ];
  
  console.log('Job embedding:', jobEmbedding);
  console.log('');
  
  const similarities = resumeEmbeddings.map(resume => {
    try {
      const similarity = cosineSimilarity(jobEmbedding, resume.embedding);
      console.log(`${resume.name}: ${similarity.toFixed(4)}`);
      return { name: resume.name, similarity };
    } catch (error) {
      console.log(`${resume.name}: ERROR - ${error.message}`);
      return { name: resume.name, similarity: 0 };
    }
  });
  
  // Check for identical similarities
  const uniqueSimilarities = [...new Set(similarities.map(s => s.similarity.toFixed(4)))];
  console.log('\nUnique similarity values:', uniqueSimilarities);
  
  if (uniqueSimilarities.length === 1) {
    console.log('⚠️  All similarities are identical - this indicates a problem!');
  } else {
    console.log('✅ Similarities are different - cosine function works correctly');
  }
  
  // Test 3: Composite Scoring Logic
  console.log('\n3️⃣ Testing Composite Scoring Logic:');
  
  const testScenarios = [
    {
      name: 'High embedding, high skills',
      embeddingScore: 0.8,
      skillOverlap: 3,
      jobSkillsCount: 4,
      contentScore: 0.9
    },
    {
      name: 'Medium embedding, low skills',
      embeddingScore: 0.5,
      skillOverlap: 1,
      jobSkillsCount: 4,
      contentScore: 0.7
    },
    {
      name: 'Low embedding, high skills',
      embeddingScore: 0.2,
      skillOverlap: 4,
      jobSkillsCount: 4,
      contentScore: 0.8
    }
  ];
  
  testScenarios.forEach(scenario => {
    const normalizedSkillScore = scenario.jobSkillsCount > 0 ? scenario.skillOverlap / scenario.jobSkillsCount : 0;
    const baseScore = (scenario.embeddingScore * 0.6) + (normalizedSkillScore * 0.3) + (scenario.contentScore * 0.1);
    
    console.log(`${scenario.name}:`);
    console.log(`  Embedding: ${scenario.embeddingScore}, Skills: ${normalizedSkillScore.toFixed(2)}, Content: ${scenario.contentScore}`);
    console.log(`  Final Score: ${baseScore.toFixed(4)}`);
    console.log('');
  });
  
  console.log('✅ Component testing complete!');
  console.log('\n💡 If cosine similarity works but you still see identical scores:');
  console.log('1. All resume embeddings might be identical');
  console.log('2. All resumes might have identical content scores');
  console.log('3. All resumes might have identical skill overlaps');
  console.log('\nCheck your server logs when running "Show Matches" for detailed scoring info.');
}

testScoringComponents();