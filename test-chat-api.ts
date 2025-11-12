/**
 * Test script for the Chat API endpoint
 *
 * This script tests the RAG pipeline by:
 * 1. Making a POST request to /api/chat
 * 2. Receiving and processing the streaming response
 * 3. Displaying the answer and sources
 *
 * Usage:
 *   1. Start the Next.js dev server: npm run dev
 *   2. Run this script: npx ts-node test-chat-api.ts
 */

interface ChatResponse {
  type: 'token' | 'complete' | 'metadata';
  content?: string;
  sources?: Array<{
    county: string;
    documentTitle: string;
    section?: string;
  }>;
  chunksUsed?: number;
}

async function testChatAPI() {
  console.log('=== Testing Chat API ===\n');

  // Test query
  const query = 'What is the redemption period in Boulder County?';
  console.log(`Query: "${query}"\n`);

  try {
    // Make request to the API
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        // county: 'Boulder', // Optional: filter by county
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      return;
    }

    // Check if response is streaming
    if (!response.body) {
      console.error('No response body received');
      return;
    }

    console.log('Streaming response:\n');
    console.log('---');

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let answer = '';
    let sources: ChatResponse['sources'] = [];
    let chunksUsed = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk
      const chunk = decoder.decode(value);

      // Split by newlines to handle multiple SSE messages
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove 'data: ' prefix

          try {
            const parsed = JSON.parse(data) as ChatResponse;

            if (parsed.type === 'token' && parsed.content) {
              // Print token to console
              process.stdout.write(parsed.content);
              answer += parsed.content;
            } else if (parsed.type === 'complete') {
              console.log('\n---\n');
            } else if (parsed.type === 'metadata') {
              sources = parsed.sources || [];
              chunksUsed = parsed.chunksUsed || 0;
            }
          } catch (e) {
            // Ignore parse errors for incomplete data
          }
        }
      }
    }

    // Display metadata
    console.log('\n=== Response Metadata ===');
    console.log(`Chunks used: ${chunksUsed}`);
    console.log(`\nSources:`);

    if (sources && sources.length > 0) {
      sources.forEach((source, index) => {
        console.log(
          `  ${index + 1}. ${source.county} County - ${source.documentTitle}${
            source.section ? ` - ${source.section}` : ''
          }`
        );
      });
    } else {
      console.log('  No sources');
    }

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testChatAPI();
