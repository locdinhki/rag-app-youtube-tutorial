import OpenAI from 'openai';
import { RAG_CONFIG } from './constants';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate embedding for a single text string
 * Uses OpenAI's text-embedding-3-small model with full 1536 dimensions
 *
 * @param text - The text to embed
 * @returns Promise<number[]> - The embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating embedding (attempt ${attempt}/${maxRetries})...`);

      const response = await openai.embeddings.create({
        model: RAG_CONFIG.EMBEDDING_MODEL,
        input: text,
        dimensions: RAG_CONFIG.EMBEDDING_DIMENSIONS,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data returned from OpenAI');
      }

      const embedding = response.data[0].embedding;

      if (embedding.length !== RAG_CONFIG.EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Expected ${RAG_CONFIG.EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`
        );
      }

      console.log(`Successfully generated embedding with ${embedding.length} dimensions`);
      return embedding;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Check if it's a rate limit error
      if (error instanceof OpenAI.APIError && error.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(`Rate limit hit, waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
        continue;
      }

      // Check for invalid API key
      if (error instanceof OpenAI.APIError && error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
      }

      // For other errors, retry with backoff
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Error generating embedding: ${lastError.message}. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
    }
  }

  throw new Error(`Failed to generate embedding after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Generate embeddings for multiple text strings in batches
 * Processes in batches of 100 (OpenAI's limit) with progress logging
 *
 * @param texts - Array of text strings to embed
 * @returns Promise<number[][]> - Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  // Filter out empty texts
  const validTexts = texts.filter(text => text && text.trim().length > 0);

  if (validTexts.length === 0) {
    throw new Error('No valid text found to generate embeddings');
  }

  const batchSize = 100; // OpenAI's batch limit
  const embeddings: number[][] = [];
  const totalBatches = Math.ceil(validTexts.length / batchSize);

  console.log(`Generating embeddings for ${validTexts.length} texts...`);
  console.log(`Using model: ${RAG_CONFIG.EMBEDDING_MODEL} with ${RAG_CONFIG.EMBEDDING_DIMENSIONS} dimensions`);

  if (validTexts.length > 50) {
    console.log(`Processing in ${totalBatches} batch(es) of up to ${batchSize} texts each...`);
  }

  for (let i = 0; i < validTexts.length; i += batchSize) {
    const batch = validTexts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (validTexts.length > 50) {
          console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} texts)...`);
        }

        const response = await openai.embeddings.create({
          model: RAG_CONFIG.EMBEDDING_MODEL,
          input: batch,
          dimensions: RAG_CONFIG.EMBEDDING_DIMENSIONS,
        });

        if (!response.data || response.data.length !== batch.length) {
          throw new Error(
            `Expected ${batch.length} embeddings, got ${response.data?.length || 0}`
          );
        }

        // Validate dimensions for all embeddings in batch
        for (const item of response.data) {
          if (item.embedding.length !== RAG_CONFIG.EMBEDDING_DIMENSIONS) {
            throw new Error(
              `Expected ${RAG_CONFIG.EMBEDDING_DIMENSIONS} dimensions, got ${item.embedding.length}`
            );
          }
        }

        embeddings.push(...response.data.map(item => item.embedding));
        break; // Success, exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Check if it's a rate limit error
        if (error instanceof OpenAI.APIError && error.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`Rate limit hit on batch ${batchNum}, waiting ${waitTime}ms before retry...`);
          await sleep(waitTime);
          continue;
        }

        // Check for invalid API key
        if (error instanceof OpenAI.APIError && error.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
        }

        // For other errors, retry with backoff
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(
            `Error processing batch ${batchNum}: ${lastError.message}. Retrying in ${waitTime}ms...`
          );
          await sleep(waitTime);
          continue;
        } else {
          throw new Error(
            `Failed to process batch ${batchNum} after ${maxRetries} attempts: ${lastError.message}`
          );
        }
      }
    }
  }

  console.log(`Successfully generated ${embeddings.length} embeddings`);

  return embeddings;
}
