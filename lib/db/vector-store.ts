import { getClient } from './postgres-client';
import { generateEmbedding, generateEmbeddings } from '../embeddings';
import { RAG_CONFIG } from '../constants';
import { DocumentChunk } from '../types';

/**
 * Query options for vector search
 */
export interface QueryOptions {
  topK?: number;
  maxDistance?: number;
  county?: string;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  id: string;
  content: string;
  distance: number;
  metadata: {
    county: string;
    documentTitle: string;
    year: number;
    sectionHeader?: string;
    subsectionHeader?: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

/**
 * Store result
 */
export interface StoreResult {
  success: boolean;
  vectorCount: number;
  error?: string;
}

/**
 * Document statistics
 */
export interface DocumentStats {
  totalChunks: number;
  countByCounty: Record<string, number>;
  totalDocuments: number;
}

/**
 * Store document chunks with embeddings in PostgreSQL
 *
 * @param chunks - Array of document chunks to store
 * @returns Promise<StoreResult> - Result of the store operation
 */
export async function storeDocumentChunks(chunks: DocumentChunk[]): Promise<StoreResult> {
  if (!chunks || chunks.length === 0) {
    return { success: false, vectorCount: 0, error: 'No chunks provided' };
  }

  const pool = getClient();
  const client = await pool.connect();

  try {
    console.log(`Storing ${chunks.length} document chunks...`);

    // Start transaction
    await client.query('BEGIN');

    // Generate embeddings for all chunks
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    console.log(`Using model: ${RAG_CONFIG.EMBEDDING_MODEL} with ${RAG_CONFIG.EMBEDDING_DIMENSIONS} dimensions`);

    const texts = chunks.map(chunk => chunk.content);
    const embeddings = await generateEmbeddings(texts);

    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`
      );
    }

    console.log('Storing vectors in PostgreSQL...');

    // Prepare the insert query
    const query = `
      INSERT INTO document_chunks
      (id, document_id, content, embedding, county, document_title, year,
       chunk_index, total_chunks, section_header, subsection_header)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    let storedCount = 0;

    // Insert each chunk with its embedding
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      // Format embedding as pgvector format: [1,2,3,...]
      const embeddingStr = `[${embedding.join(',')}]`;

      await client.query(query, [
        chunk.id,
        chunk.documentId,
        chunk.content,
        embeddingStr,
        chunk.metadata.county,
        chunk.metadata.documentTitle,
        chunk.metadata.year,
        chunk.metadata.chunkIndex,
        chunk.metadata.totalChunks,
        chunk.metadata.sectionHeader || null,
        chunk.metadata.subsectionHeader || null,
      ]);

      storedCount++;

      // Log progress for large uploads
      if (chunks.length > 10 && (storedCount % 10 === 0 || storedCount === chunks.length)) {
        console.log(`Stored ${storedCount}/${chunks.length} chunks...`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log(`Successfully stored ${storedCount} vectors`);

    return {
      success: true,
      vectorCount: storedCount,
    };

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error storing document chunks:', errorMessage);

    return {
      success: false,
      vectorCount: 0,
      error: errorMessage,
    };

  } finally {
    client.release();
  }
}

/**
 * Delete all vectors for a specific document
 *
 * @param documentId - The document ID to delete
 * @returns Promise<boolean> - Success status
 */
export async function deleteDocumentVectors(documentId: string): Promise<boolean> {
  if (!documentId) {
    console.error('No document ID provided for deletion');
    return false;
  }

  const pool = getClient();
  const client = await pool.connect();

  try {
    console.log(`Deleting vectors for document: ${documentId}`);

    // Use prepared statement to prevent SQL injection
    const result = await client.query(
      'DELETE FROM document_chunks WHERE document_id = $1',
      [documentId]
    );

    const deletedCount = result.rowCount || 0;
    console.log(`Deleted ${deletedCount} chunks for document ${documentId}`);

    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting document vectors:', errorMessage);
    return false;

  } finally {
    client.release();
  }
}

/**
 * Query vectors using semantic search with cosine distance
 * CRITICAL: Always uses <=> operator (cosine distance) to match the index
 *
 * @param queryText - The text to search for
 * @param options - Query options (topK, maxDistance, county filter)
 * @returns Promise<VectorSearchResult[]> - Array of matching results
 */
export async function queryVectors(
  queryText: string,
  options: QueryOptions = {}
): Promise<VectorSearchResult[]> {
  if (!queryText || queryText.trim().length === 0) {
    console.warn('Empty query text provided');
    return [];
  }

  const {
    topK = RAG_CONFIG.DEFAULT_TOP_K,
    maxDistance = RAG_CONFIG.MAX_DISTANCE_THRESHOLD,
    county,
  } = options;

  const pool = getClient();
  const client = await pool.connect();

  try {
    console.log(`Querying vectors for: "${queryText.substring(0, 50)}${queryText.length > 50 ? '...' : ''}"`);
    if (county) {
      console.log(`Filtering by county: ${county}`);
    }

    // Generate embedding for query text
    console.log(`Generating query embedding...`);
    const queryEmbedding = await generateEmbedding(queryText);

    // Format embedding for PostgreSQL
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // CRITICAL: Use <=> operator (cosine distance) to match the index
    // Build query with optional county filter
    let query: string;
    let queryParams: unknown[];

    if (county) {
      query = `
        SELECT
          id,
          content,
          county,
          document_title,
          year,
          section_header,
          subsection_header,
          chunk_index,
          total_chunks,
          embedding ${RAG_CONFIG.DISTANCE_OPERATOR} $1::vector AS distance
        FROM document_chunks
        WHERE county = $2
        ORDER BY embedding ${RAG_CONFIG.DISTANCE_OPERATOR} $1::vector
        LIMIT $3
      `;
      queryParams = [embeddingStr, county, topK];
    } else {
      query = `
        SELECT
          id,
          content,
          county,
          document_title,
          year,
          section_header,
          subsection_header,
          chunk_index,
          total_chunks,
          embedding ${RAG_CONFIG.DISTANCE_OPERATOR} $1::vector AS distance
        FROM document_chunks
        ORDER BY embedding ${RAG_CONFIG.DISTANCE_OPERATOR} $1::vector
        LIMIT $2
      `;
      queryParams = [embeddingStr, topK];
    }

    console.log(`Executing vector search with ${RAG_CONFIG.DISTANCE_OPERATOR} operator...`);
    const result = await client.query(query, queryParams);

    console.log(`Found ${result.rows.length} results before distance filtering`);

    // Filter by max distance threshold and map to result format
    const results: VectorSearchResult[] = result.rows
      .filter(row => row.distance <= maxDistance)
      .map(row => ({
        id: row.id,
        content: row.content,
        distance: parseFloat(row.distance),
        metadata: {
          county: row.county,
          documentTitle: row.document_title,
          year: row.year,
          sectionHeader: row.section_header || undefined,
          subsectionHeader: row.subsection_header || undefined,
          chunkIndex: row.chunk_index,
          totalChunks: row.total_chunks,
        },
      }));

    console.log(
      `Returning ${results.length} results after distance threshold filtering (max: ${maxDistance})`
    );

    if (results.length > 0) {
      console.log(`Distance range: ${results[0].distance.toFixed(4)} - ${results[results.length - 1].distance.toFixed(4)}`);
    } else {
      console.log('No results found within distance threshold');
    }

    return results;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error querying vectors:', errorMessage);
    return [];

  } finally {
    client.release();
  }
}

/**
 * Get statistics about stored documents
 *
 * @returns Promise<DocumentStats> - Document statistics
 */
export async function getDocumentStats(): Promise<DocumentStats> {
  const pool = getClient();
  const client = await pool.connect();

  try {
    // Get total chunk count
    const totalResult = await client.query(
      'SELECT COUNT(*) as count FROM document_chunks'
    );
    const totalChunks = parseInt(totalResult.rows[0].count);

    // Get count by county
    const countyResult = await client.query(`
      SELECT county, COUNT(*) as count
      FROM document_chunks
      GROUP BY county
      ORDER BY county
    `);

    const countByCounty: Record<string, number> = {};
    for (const row of countyResult.rows) {
      countByCounty[row.county] = parseInt(row.count);
    }

    // Get total distinct documents
    const documentResult = await client.query(
      'SELECT COUNT(DISTINCT document_id) as count FROM document_chunks'
    );
    const totalDocuments = parseInt(documentResult.rows[0].count);

    console.log(`Document stats: ${totalChunks} chunks, ${totalDocuments} documents`);

    return {
      totalChunks,
      countByCounty,
      totalDocuments,
    };

  } catch (error) {
    console.error('Error getting document stats:', error);
    return {
      totalChunks: 0,
      countByCounty: {},
      totalDocuments: 0,
    };

  } finally {
    client.release();
  }
}
