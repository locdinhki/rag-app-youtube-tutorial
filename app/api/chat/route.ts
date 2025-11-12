import { NextRequest, NextResponse } from 'next/server';
import { retrieveRelevantChunks, formatContextForLLM, extractSources } from '@/lib/retrieval';
import { generateAnswer } from '@/lib/answer-generation';

/**
 * Request body interface
 */
interface ChatRequestBody {
  message: string;
  county?: string;
  conversationHistory?: Message[];
}

/**
 * Message interface for conversation history
 */
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * POST /api/chat
 *
 * Handles chat queries with RAG pipeline:
 * 1. Validates request
 * 2. Retrieves relevant chunks using semantic search
 * 3. Formats context for LLM
 * 4. Generates streaming response
 * 5. Returns sources with final message
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as ChatRequestBody;

    // Validate message
    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const { message: query, county } = body;

    console.log('=== Chat API Request ===');
    console.log(`Query: "${query}"`);
    console.log(`County filter: ${county || 'none'}`);

    // Step 1: Retrieve relevant chunks
    let chunks;
    try {
      chunks = await retrieveRelevantChunks(query, {
        county,
        topK: 5,
      });
    } catch (error) {
      console.error('Retrieval error:', error);
      return NextResponse.json(
        {
          error: 'Failed to search documents',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Step 2: Check if chunks were found
    if (!chunks || chunks.length === 0) {
      console.log('No relevant chunks found');

      const noResultsMessage = county
        ? `I couldn't find any relevant information about "${query}" in the uploaded documents from ${county} County. You may need to upload ${county} County tax lien guidelines or try searching without the county filter.`
        : `I couldn't find any relevant information about "${query}" in the uploaded documents. You may need to upload tax lien guidelines from the relevant county.`;

      // Return as streaming response for consistency
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send the message as tokens
          const tokens = noResultsMessage.split(' ');
          tokens.forEach((token, index) => {
            const content = index === 0 ? token : ' ' + token;
            const data = JSON.stringify({ type: 'token', content });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          });

          // Send completion signal
          const completeData = JSON.stringify({ type: 'complete' });
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));

          // Send metadata with empty sources
          const metadata = {
            type: 'metadata',
            sources: [],
            chunksUsed: 0,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

          controller.close();
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    console.log(`Found ${chunks.length} relevant chunks`);

    // Step 3: Format context for LLM
    const context = formatContextForLLM(chunks);

    // Step 4: Generate streaming response
    let stream;
    try {
      stream = await generateAnswer(query, context, true);

      if (!(stream instanceof ReadableStream)) {
        throw new Error('Expected ReadableStream but got string');
      }
    } catch (error) {
      console.error('Answer generation error:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate response',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Step 5: Extract sources
    const sources = extractSources(chunks);

    // Create a new stream that includes metadata at the end
    const encoder = new TextEncoder();
    const transformedStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = stream.getReader();

          // Stream all tokens
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // After streaming is complete, send metadata
              const metadata = {
                type: 'metadata',
                sources: sources.map((s) => ({
                  county: s.county,
                  documentTitle: s.documentTitle,
                  section: s.section || undefined,
                })),
                chunksUsed: chunks.length,
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));
              controller.close();
              break;
            }

            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Stream transformation error:', error);
          controller.error(error);
        }
      },
    });

    // Return streaming response
    return new NextResponse(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Unexpected error in chat API:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Handle all other errors
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 *
 * Returns API information
 */
export async function GET() {
  return NextResponse.json({
    name: 'Chat API',
    version: '1.0.0',
    description: 'RAG-powered chat endpoint for Colorado tax lien questions',
    methods: ['POST'],
    endpoint: '/api/chat',
    requestBody: {
      message: 'string (required) - User query',
      county: 'string (optional) - Filter by specific Colorado county',
      conversationHistory: 'Message[] (optional) - Previous conversation for context',
    },
    responseFormat: 'Server-Sent Events (SSE) stream with JSON data',
  });
}
