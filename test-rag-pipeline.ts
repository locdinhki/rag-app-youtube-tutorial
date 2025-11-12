/**
 * Unit test for RAG pipeline components
 *
 * Tests the retrieval and answer generation functions directly
 * without needing to start the Next.js server
 *
 * Usage: npx ts-node test-rag-pipeline.ts
 */

import { retrieveRelevantChunks, formatContextForLLM, extractSources } from './lib/retrieval';
import { generateAnswerSync } from './lib/answer-generation';
import { initDatabase } from './lib/db/postgres-client';

async function testRAGPipeline() {
  console.log('=== Testing RAG Pipeline Components ===\n');

  try {
    // Initialize database connection
    console.log('1. Initializing database...');
    await initDatabase();
    console.log('   ✓ Database initialized\n');

    // Test query
    const query = 'What is the redemption period in Boulder County?';
    console.log(`2. Testing semantic search`);
    console.log(`   Query: "${query}"\n`);

    // Step 1: Retrieve relevant chunks
    console.log('   Retrieving relevant chunks...');
    const chunks = await retrieveRelevantChunks(query, {
      topK: 5,
      // county: 'Boulder', // Optional: filter by county
    });

    if (chunks.length === 0) {
      console.log('   ✗ No chunks found');
      console.log('\n   This could mean:');
      console.log('   - No documents have been uploaded yet');
      console.log('   - The query is too specific or unrelated to uploaded content');
      console.log('   - The distance threshold filtered out all results');
      console.log('\n   Try uploading some documents first using the /upload API');
      return;
    }

    console.log(`   ✓ Retrieved ${chunks.length} chunks\n`);

    // Display chunk details
    console.log('   Chunk details:');
    chunks.forEach((chunk, index) => {
      console.log(`   ${index + 1}. Distance: ${chunk.distance.toFixed(4)}`);
      console.log(`      County: ${chunk.county}`);
      console.log(`      Document: ${chunk.documentTitle}`);
      if (chunk.sectionHeader) {
        console.log(`      Section: ${chunk.sectionHeader}`);
      }
      console.log(`      Preview: ${chunk.content.substring(0, 100)}...`);
      console.log('');
    });

    // Step 2: Format context
    console.log('3. Formatting context for LLM...');
    const context = formatContextForLLM(chunks);
    console.log(`   ✓ Context formatted (${context.length} characters)\n`);

    // Display formatted context (first 500 chars)
    console.log('   Context preview:');
    console.log('   ---');
    console.log('   ' + context.substring(0, 500).replace(/\n/g, '\n   '));
    if (context.length > 500) {
      console.log('   ...');
    }
    console.log('   ---\n');

    // Step 3: Extract sources
    console.log('4. Extracting sources...');
    const sources = extractSources(chunks);
    console.log(`   ✓ Found ${sources.length} unique sources\n`);

    console.log('   Sources:');
    sources.forEach((source, index) => {
      console.log(
        `   ${index + 1}. ${source.county} County - ${source.documentTitle}${
          source.section ? ` - ${source.section}` : ''
        }`
      );
    });
    console.log('');

    // Step 4: Generate answer (non-streaming)
    console.log('5. Generating answer...');
    const answer = await generateAnswerSync(query, context);
    console.log(`   ✓ Answer generated (${answer.length} characters)\n`);

    console.log('   Answer:');
    console.log('   ---');
    console.log('   ' + answer.replace(/\n/g, '\n   '));
    console.log('   ---\n');

    console.log('=== All Tests Passed ✓ ===');
  } catch (error) {
    console.error('\n✗ Error during testing:', error);

    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Run the test
testRAGPipeline();
