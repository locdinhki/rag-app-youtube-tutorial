import { Pool, PoolClient } from 'pg';
import { RAG_CONFIG } from '../constants';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Get the PostgreSQL connection pool instance
 */
export function getClient(): Pool {
  return pool;
}

/**
 * Get a PostgreSQL client from the pool
 * Remember to call client.release() when done
 */
export async function getPostgresClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * Initialize the database with pgvector extension and required tables
 * CRITICAL: This must be called before any vector operations
 */
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('Connecting to PostgreSQL...');

    // Create pgvector extension
    console.log('Initializing pgvector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Create document_chunks table with proper schema
    console.log('Creating document_chunks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(${RAG_CONFIG.EMBEDDING_DIMENSIONS}),
        county TEXT NOT NULL,
        document_title TEXT NOT NULL,
        year INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        total_chunks INTEGER NOT NULL,
        section_header TEXT,
        subsection_header TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // CRITICAL: Create index with vector_cosine_ops (for <=> operator)
    // Use lists=1 for small datasets (< 1000 rows) to avoid index scan issues
    console.log('Creating vector index with cosine distance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
      ON document_chunks USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 1)
    `);

    // Create index for filtering by county
    console.log('Creating county index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS document_chunks_county_idx
      ON document_chunks(county)
    `);

    // Create index for document_id lookups
    console.log('Creating document_id index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
      ON document_chunks(document_id)
    `);

    console.log('Database initialization completed successfully');

    // Log current stats
    const stats = await client.query('SELECT COUNT(*) as count FROM document_chunks');
    console.log(`Current document chunks in database: ${stats.rows[0].count}`);

  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export default pool;
