/**
 * RAG Configuration Constants
 *
 * CRITICAL: These constants ensure consistency across all retrieval code.
 * - Distance threshold: 1.2 (allows more results while filtering noise)
 * - Distance operator: <=> (cosine distance) ONLY
 * - Embedding dimensions: 1536 (text-embedding-3-small with full dimensions)
 */
export const RAG_CONFIG = {
  // Retrieval settings
  DEFAULT_TOP_K: 5,
  MAX_DISTANCE_THRESHOLD: 1.2,  // Cosine distance (0 = identical, 2 = opposite)

  // Embedding settings
  EMBEDDING_MODEL: 'text-embedding-3-small',
  EMBEDDING_DIMENSIONS: 1536,  // Full dimensions for best quality

  // Chunking settings
  CHUNK_SIZE: 1000,              // Target characters per chunk
  CHUNK_OVERLAP: 200,            // Character overlap between chunks

  // Minimum chunk size in characters
  MIN_CHUNK_SIZE: 200,

  // Maximum file size in bytes (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  // Distance operator (NEVER CHANGE THIS)
  DISTANCE_OPERATOR: '<=>' as const,  // Cosine distance operator
} as const;
