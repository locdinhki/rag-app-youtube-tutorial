import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * System prompt for the RAG assistant
 */
const SYSTEM_PROMPT = `You are a helpful assistant specializing in Colorado tax lien redemption processes.

Your role:
- Answer questions accurately based on the provided context from county documents
- Always cite which county and document your information comes from
- If the context doesn't contain the answer, clearly state that
- Use a professional but friendly tone
- Be specific and precise with numbers, dates, and procedures
- Never make up information not in the context

Format your answers with:
1. Direct answer to the question
2. Supporting details from the context
3. Source citations in brackets [County Name - Document]

If comparing multiple counties, structure the comparison clearly.`;

/**
 * Create a user prompt with context and query
 */
function createUserPrompt(query: string, context: string): string {
  return `Context from uploaded documents:
${context}

User Question: ${query}

Instructions:
- Answer based ONLY on the provided context
- Cite sources after each fact: [County - Document - Section]
- If information is not in the context, say: "I don't have information about that in the uploaded documents. You may need to upload guidelines from [relevant county]."
- Be concise but complete`;
}

/**
 * Generate answer using OpenAI with streaming support
 *
 * @param query - User's question
 * @param context - Formatted context from retrieved chunks
 * @param stream - Whether to stream the response
 * @returns ReadableStream if streaming, or complete response if not
 */
export async function generateAnswer(
  query: string,
  context: string,
  stream: boolean = true
): Promise<ReadableStream<Uint8Array> | string> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  if (!context || context.trim().length === 0) {
    throw new Error('Context cannot be empty');
  }

  try {
    console.log(`Generating answer (streaming: ${stream})...`);

    const userPrompt = createUserPrompt(query, context);

    // Call OpenAI Chat Completion API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective and fast
      temperature: 0.1, // Low temperature for factual consistency
      max_tokens: 800,
      stream,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    if (stream) {
      // Return a ReadableStream for streaming response
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
              const content = chunk.choices[0]?.delta?.content;

              if (content) {
                // Send the content as a JSON-formatted token
                const data = JSON.stringify({ type: 'token', content });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }

            // Send completion signal
            const completeData = JSON.stringify({ type: 'complete' });
            controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));

            controller.close();
          } catch (error) {
            console.error('Error in stream:', error);
            controller.error(error);
          }
        },
      });

      return readableStream;
    } else {
      // Return complete response
      const completion = response as OpenAI.Chat.Completions.ChatCompletion;
      const answer = completion.choices[0]?.message?.content || '';

      if (!answer) {
        throw new Error('No answer generated from OpenAI');
      }

      console.log(`Generated response (${answer.length} characters)`);
      return answer;
    }
  } catch (error) {
    console.error('Error generating answer:', error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
      }
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Failed to generate response: ${error.message}`);
    }

    throw new Error('Failed to generate response due to an unknown error');
  }
}

/**
 * Generate answer without streaming (for testing or non-streaming contexts)
 *
 * @param query - User's question
 * @param context - Formatted context from retrieved chunks
 * @returns Complete answer string
 */
export async function generateAnswerSync(
  query: string,
  context: string
): Promise<string> {
  const result = await generateAnswer(query, context, false);

  if (typeof result !== 'string') {
    throw new Error('Expected string response but got stream');
  }

  return result;
}
