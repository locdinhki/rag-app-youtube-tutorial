import { getClient } from './db/postgres-client';
import { generateEmbedding } from './embeddings';
import { RAG_CONFIG } from './constants';

/**
 * Retrieval options for semantic search
 */
export interface RetrievalOptions {
  topK?: number; // Number of chunks to retrieve (default 5)
  county?: string; // Filter by specific county
  minDistance?: number; // Maximum distance threshold (default 1.2)
}

/**
 * Document chunk with distance score
 */
export interface RetrievedChunk {
  id: string;
  content: string;
  county: string;
  documentTitle: string;
  sectionHeader: string | null;
  subsectionHeader: string | null;
  distance: number; // Similarity distance (lower = more similar)
}

/**
 * Source attribution for an answer
 */
export interface ChunkSource {
  county: string;
  documentTitle: string;
  section: string | null;
}

/**
 * Retrieve relevant document chunks using semantic search
 *
 * @param query - User's search query
 * @param options - Optional retrieval parameters
 * @returns Array of relevant chunks with metadata and similarity scores
 */
export async function retrieveRelevantChunks(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
  const {
    topK = RAG_CONFIG.DEFAULT_TOP_K,
    county,
    minDistance = RAG_CONFIG.MAX_DISTANCE_THRESHOLD,
  } = options;

  // Validate input
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  try {
    console.log(`Query: "${query}"`);
    console.log(`Retrieval options: topK=${topK}, county=${county || 'all'}, minDistance=${minDistance}`);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Build PostgreSQL query with optional county filter
    const pool = getClient();
    const client = await pool.connect();

    let sqlQuery: string;
    let queryParams: (string | number)[];

    if (county) {
      // Query with county filter
      sqlQuery = `
        SELECT
          id,
          content,
          county,
          document_title,
          section_header,
          subsection_header,
          embedding <=> $1::vector AS distance
        FROM document_chunks
        WHERE county = $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `;
      queryParams = [JSON.stringify(queryEmbedding), county, topK];
    } else {
      // Query without county filter
      sqlQuery = `
        SELECT
          id,
          content,
          county,
          document_title,
          section_header,
          subsection_header,
          embedding <=> $1::vector AS distance
        FROM document_chunks
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;
      queryParams = [JSON.stringify(queryEmbedding), topK];
    }

    // Execute the query
    // For small datasets, disable index scan to force sequential scan
    // This fixes IVFFlat index issues when lists=100 but only have ~8 rows
    let result;
    try {
      await client.query('SET LOCAL enable_indexscan = off');
      result = await client.query(sqlQuery, queryParams);
    } finally {
      client.release();
    }

    // Handle no results
    if (!result.rows || result.rows.length === 0) {
      console.log('No relevant chunks found');
      return [];
    }

    // Filter by distance threshold
    const filteredChunks: RetrievedChunk[] = result.rows
      .filter((row: {distance: number}) => row.distance <= minDistance)
      .map((row: {
        id: string;
        content: string;
        county: string;
        document_title: string;
        section_header: string | null;
        subsection_header: string | null;
        distance: number;
      }) => ({
        id: row.id,
        content: row.content,
        county: row.county,
        documentTitle: row.document_title,
        sectionHeader: row.section_header,
        subsectionHeader: row.subsection_header,
        distance: row.distance,
      }));

    // Log results
    if (filteredChunks.length === 0) {
      console.log(`Retrieved ${result.rows.length} chunks but all were above distance threshold (${minDistance})`);
      return [];
    }

    const distances = filteredChunks.map((c: RetrievedChunk) => c.distance.toFixed(3));
    console.log(`Retrieved ${filteredChunks.length} chunks (distances: ${distances.join(', ')})`);

    return filteredChunks;

  } catch (error) {
    console.error('Error retrieving relevant chunks:', error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('relation "document_chunks" does not exist')) {
        throw new Error('Database not initialized. Please upload documents first.');
      }
      throw new Error(`Failed to search documents: ${error.message}`);
    }

    throw new Error('Failed to search documents due to an unknown error');
  }
}

/**
 * Format retrieved chunks into a context string for the LLM
 *
 * @param chunks - Array of retrieved chunks
 * @returns Formatted context string with source attribution
 */
export function formatContextForLLM(chunks: RetrievedChunk[]): string {
  if (!chunks || chunks.length === 0) {
    return '';
  }

  const contextParts: string[] = ['Context from Colorado Tax Lien Documents:', ''];

  chunks.forEach((chunk: RetrievedChunk, index: number) => {
    // Build section path
    const sectionPath = [
      chunk.sectionHeader,
      chunk.subsectionHeader,
    ]
      .filter(Boolean)
      .join(' - ');

    // Add source header
    const sourceHeader = `[${chunk.county} County - ${chunk.documentTitle}${
      sectionPath ? ' - ' + sectionPath : ''
    }]`;

    contextParts.push(sourceHeader);
    contextParts.push(chunk.content);

    // Add spacing between chunks (except for the last one)
    if (index < chunks.length - 1) {
      contextParts.push('');
    }
  });

  return contextParts.join('\n');
}

/**
 * Extract unique sources from retrieved chunks
 *
 * @param chunks - Array of retrieved chunks
 * @returns Array of unique source attributions
 */
export function extractSources(chunks: RetrievedChunk[]): ChunkSource[] {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  const sourcesMap = new Map<string, ChunkSource>();

  chunks.forEach((chunk: RetrievedChunk) => {
    const key = `${chunk.county}|${chunk.documentTitle}|${chunk.sectionHeader || ''}`;

    if (!sourcesMap.has(key)) {
      sourcesMap.set(key, {
        county: chunk.county,
        documentTitle: chunk.documentTitle,
        section: chunk.sectionHeader,
      });
    }
  });

  return Array.from(sourcesMap.values());
}
