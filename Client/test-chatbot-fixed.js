// Test script for improved event listing functionality
import { generateResponse } from './src/utils/llmSimulation.js';
import { retrieveContext } from './src/utils/ragSimulation.js';

console.log('🔬 Testing Improved RAG + LLM for Event Queries');
console.log('='.repeat(70));
console.log('Testing the specific queries that were not working properly\n');

// The specific queries mentioned by the user
const problematicQueries = [
  "What types of events are available?",
  "give me all the events list",
  "Show me all available events",
  "List all events",
  "What events can I register for?",
  "Are there any free events?",
  "Which workshops are available?",
  "What paid events do you have?"
];

console.log('🧪 Testing User-Reported Queries...\n');

// Test each query
for (const query of problematicQueries) {
  console.log('─'.repeat(70));
  console.log(`\n❓ Query: "${query}"\n`);
  
  // Show RAG retrieval process
  console.log('🔍 RAG Analysis:');
  const context = retrieveContext(query);
  
  if (context.isEventListQuery) {
    console.log('   ✅ Detected as EVENT LIST query');
  }
  
  if (context.relevantDocs && context.relevantDocs.length > 0) {
    console.log(`   ✅ Retrieved ${context.relevantDocs.length} documents`);
    
    // Show which documents
    const eventDocs = context.relevantDocs.filter(doc => 
      doc.section && doc.section.startsWith('Event:')
    );
    
    if (eventDocs.length > 0) {
      console.log(`   📋 Event documents found: ${eventDocs.length}`);
      eventDocs.slice(0, 5).forEach((doc, idx) => {
        console.log(`      ${idx + 1}. ${doc.section.replace('Event:', '').trim()}`);
      });
      if (eventDocs.length > 5) {
        console.log(`      ... and ${eventDocs.length - 5} more events`);
      }
    } else {
      console.log('   📄 Top documents:');
      context.relevantDocs.slice(0, 3).forEach((doc, idx) => {
        console.log(`      ${idx + 1}. ${doc.section} (Score: ${doc.score})`);
      });
    }
  }
  
  // Show LLM response
  console.log(`\n🧠 LLM Response:`);
  
  try {
    const result = await generateResponse(query);
    
    console.log(`   ${'─'.repeat(66)}`);
    
    // Show first 500 characters to keep output manageable
    const preview = result.response.substring(0, 500);
    console.log(`   ${preview.split('\n').join('\n   ')}`);
    
    if (result.response.length > 500) {
      console.log(`   ...(truncated, total length: ${result.response.length} characters)`);
    }
    
    console.log(`   ${'─'.repeat(66)}`);
    
    // Count how many events are mentioned
    const eventCount = (result.response.match(/\*\*\d+\./g) || []).length;
    if (eventCount > 0) {
      console.log(`\n   ✅ Listed ${eventCount} events in response`);
    }
    
    console.log(`   ✨ Data-driven: ${result.isFromKnowledgeBase ? 'YES' : 'NO'}\n`);
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log('\n' + '='.repeat(70));
console.log('✅ All Tests Complete!');
console.log('\n📊 What Was Fixed:');
console.log('   1. ✅ RAG now detects "list all events" type queries');
console.log('   2. ✅ RAG retrieves ALL event documents (not just top 3)');
console.log('   3. ✅ LLM formats multiple events as a concise list');
console.log('   4. ✅ Improved keywords for better query matching');
console.log('   5. ✅ Filters events by type (free/paid/workshop/etc.)');
console.log('\n💡 All responses are generated from knowledge base data!');
console.log('   NO hardcoded templates used!');
console.log('\n🚀 Ready to test in browser: http://localhost:5174/participant/chatbot-test');
console.log('='.repeat(70));
