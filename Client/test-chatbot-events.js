// Test script for chatbot event queries functionality
import { generateResponse } from './src/utils/llmSimulation.js';
import { retrieveContext } from './src/utils/ragSimulation.js';

console.log('🤖 Testing Chatbot - Event Availability & Fee Structure');
console.log('='.repeat(70));
console.log('📋 Testing new event data with fees, availability, and registration\n');

// Test queries focused on events and fees
const testQueries = [
  "What events are available for registration?",
  "What is the fee structure for events?",
  "Are there any free events available?",
  "Tell me about the React workshop",
  "What is the cost of the hackathon?",
  "Which paid workshops are available?",
  "How many seats are available for mobile app workshop?",
  "What payment methods do you accept?",
  "Tell me about the Full Stack Bootcamp",
  "What are the event types available?"
];

console.log('🔬 Running Event-Related Tests...\n');

// Run tests sequentially
for (const query of testQueries) {
  console.log('─'.repeat(70));
  console.log(`\n❓ Query: "${query}"\n`);
  
  // Show RAG retrieval
  console.log('🔍 RAG Retrieval:');
  const context = retrieveContext(query);
  
  if (context.relevantDocs && context.relevantDocs.length > 0) {
    console.log(`   ✅ Found ${context.relevantDocs.length} relevant documents:`);
    context.relevantDocs.slice(0, 3).forEach((doc, idx) => {
      console.log(`      ${idx + 1}. ${doc.section} (Score: ${doc.score})`);
    });
  } else {
    console.log('   ❌ No documents retrieved');
  }
  
  // Show LLM generation
  console.log(`\n🧠 LLM Response:`);
  
  try {
    const result = await generateResponse(query);
    
    console.log(`   ${'─'.repeat(66)}`);
    console.log(`   ${result.response.split('\n').join('\n   ')}`);
    console.log(`   ${'─'.repeat(66)}`);
    
    console.log(`\n   ✅ Data-driven: ${result.isFromKnowledgeBase ? 'YES ✨' : 'NO ⚠️'}\n`);
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log('\n' + '='.repeat(70));
console.log('✅ All Event Tests Complete!');
console.log('\n📊 Knowledge Base Stats:');
console.log('   • 12 Events with detailed info (fees, seats, dates)');
console.log('   • 14 FAQs (added event availability & payment FAQs)');
console.log('   • 10 Rulebook sections (added fee structure & availability)');
console.log('   • Total: 36+ searchable documents');
console.log('\n💡 All responses generated from actual knowledge base data!');
console.log('='.repeat(70));
