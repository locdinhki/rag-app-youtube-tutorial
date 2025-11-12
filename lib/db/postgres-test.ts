import { getClient } from './postgres-client';
import { RAG_CONFIG } from '../constants';

/**
 * Test utility functions for PostgreSQL and pgvector
 * Use these functions to verify database setup and troubleshoot issues
 */

/**
 * Verify PostgreSQL connection
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const pool = getClient();
    const client = await pool.connect();

    await client.query('SELECT 1');
    client.release();

    console.log('✓ PostgreSQL connection successful');
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ PostgreSQL connection failed:', message);
    return { success: false, message };
  }
}

/**
 * Check if pgvector extension is installed
 */
export async function checkPgvectorExtension(): Promise<{
  success: boolean;
  installed: boolean;
  version?: string;
  message: string;
}> {
  try {
    const pool = getClient();
    const client = await pool.connect();

    const result = await client.query(`
      SELECT extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `);

    client.release();

    if (result.rows.length > 0) {
      const version = result.rows[0].extversion;
      console.log(`✓ pgvector extension installed (version ${version})`);
      return {
        success: true,
        installed: true,
        version,
        message: `pgvector ${version} is installed`,
      };
    } else {
      console.log('✗ pgvector extension not installed');
      return {
        success: true,
        installed: false,
        message: 'pgvector extension not found',
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Error checking pgvector extension:', message);
    return { success: false, installed: false, message };
  }
}

/**
 * Verify that the index uses vector_cosine_ops
 */
export async function verifyVectorIndex(): Promise<{
  success: boolean;
  exists: boolean;
  usesCosinOps?: boolean;
  details?: string;
  message: string;
}> {
  try {
    const pool = getClient();
    const client = await pool.connect();

    // Check if index exists and get its details
    const result = await client.query(`
      SELECT
        i.indexname,
        pg_get_indexdef(i.indexrelid) as indexdef
      FROM pg_indexes i
      WHERE i.tablename = 'document_chunks'
        AND i.indexname = 'document_chunks_embedding_idx'
    `);

    client.release();

    if (result.rows.length === 0) {
      console.log('✗ Vector index not found');
      return {
        success: true,
        exists: false,
        message: 'Index document_chunks_embedding_idx does not exist',
      };
    }

    const indexDef = result.rows[0].indexdef;
    const usesCosinOps = indexDef.includes('vector_cosine_ops');

    if (usesCosinOps) {
      console.log('✓ Vector index exists and uses vector_cosine_ops');
      return {
        success: true,
        exists: true,
        usesCosinOps: true,
        details: indexDef,
        message: 'Index correctly configured with vector_cosine_ops',
      };
    } else {
      console.log('✗ Vector index exists but does not use vector_cosine_ops');
      console.log('Index definition:', indexDef);
      return {
        success: true,
        exists: true,
        usesCosinOps: false,
        details: indexDef,
        message: 'Index exists but not using vector_cosine_ops (should be recreated)',
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Error verifying vector index:', message);
    return { success: false, exists: false, message };
  }
}

/**
 * Get table statistics
 */
export async function getTableStats(): Promise<{
  success: boolean;
  totalRows?: number;
  tableSize?: string;
  indexSize?: string;
  countByCounty?: Record<string, number>;
  message: string;
}> {
  try {
    const pool = getClient();
    const client = await pool.connect();

    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'document_chunks'
      )
    `);

    if (!tableExists.rows[0].exists) {
      client.release();
      console.log('✗ Table document_chunks does not exist');
      return {
        success: true,
        totalRows: 0,
        message: 'Table document_chunks does not exist',
      };
    }

    // Get row count
    const rowCount = await client.query('SELECT COUNT(*) as count FROM document_chunks');
    const totalRows = parseInt(rowCount.rows[0].count);

    // Get table size
    const sizeQuery = await client.query(`
      SELECT
        pg_size_pretty(pg_total_relation_size('document_chunks')) as table_size,
        pg_size_pretty(pg_indexes_size('document_chunks')) as index_size
    `);
    const tableSize = sizeQuery.rows[0].table_size;
    const indexSize = sizeQuery.rows[0].index_size;

    // Get count by county
    const countyQuery = await client.query(`
      SELECT county, COUNT(*) as count
      FROM document_chunks
      GROUP BY county
      ORDER BY county
    `);

    const countByCounty: Record<string, number> = {};
    for (const row of countyQuery.rows) {
      countByCounty[row.county] = parseInt(row.count);
    }

    client.release();

    console.log(`✓ Table stats retrieved: ${totalRows} rows, ${tableSize} total size`);
    console.log(`  Index size: ${indexSize}`);
    console.log('  Rows by county:', countByCounty);

    return {
      success: true,
      totalRows,
      tableSize,
      indexSize,
      countByCounty,
      message: `Table has ${totalRows} rows (${tableSize})`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Error getting table stats:', message);
    return { success: false, message };
  }
}

/**
 * Test vector search with a sample embedding
 * Creates a random embedding and searches for similar vectors
 */
export async function testVectorSearch(): Promise<{
  success: boolean;
  resultCount?: number;
  sampleDistances?: number[];
  message: string;
}> {
  try {
    const pool = getClient();
    const client = await pool.connect();

    // Check if we have any data
    const countResult = await client.query('SELECT COUNT(*) as count FROM document_chunks');
    const totalRows = parseInt(countResult.rows[0].count);

    if (totalRows === 0) {
      client.release();
      console.log('✗ No data in table to test vector search');
      return {
        success: true,
        resultCount: 0,
        message: 'No data available for testing',
      };
    }

    // Create a random embedding for testing
    const randomEmbedding = Array.from(
      { length: RAG_CONFIG.EMBEDDING_DIMENSIONS },
      () => Math.random() * 2 - 1
    );

    // Normalize the embedding (important for cosine distance)
    const magnitude = Math.sqrt(randomEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = randomEmbedding.map(val => val / magnitude);

    const embeddingStr = `[${normalizedEmbedding.join(',')}]`;

    // Test vector search
    const searchResult = await client.query(
      `
      SELECT
        id,
        county,
        document_title,
        embedding ${RAG_CONFIG.DISTANCE_OPERATOR} $1::vector AS distance
      FROM document_chunks
      ORDER BY embedding ${RAG_CONFIG.DISTANCE_OPERATOR} $1::vector
      LIMIT 5
    `,
      [embeddingStr]
    );

    client.release();

    const resultCount = searchResult.rows.length;
    const sampleDistances = searchResult.rows.map((row: { distance: string }) => parseFloat(row.distance));

    console.log(`✓ Vector search test successful: found ${resultCount} results`);
    console.log(`  Sample distances: ${sampleDistances.map(d => d.toFixed(4)).join(', ')}`);
    console.log(`  Distance operator: ${RAG_CONFIG.DISTANCE_OPERATOR} (cosine distance)`);

    return {
      success: true,
      resultCount,
      sampleDistances,
      message: `Found ${resultCount} results with distances ranging from ${sampleDistances[0].toFixed(4)} to ${sampleDistances[sampleDistances.length - 1].toFixed(4)}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Error testing vector search:', message);
    return { success: false, message };
  }
}

/**
 * Run all tests and display a comprehensive report
 */
export async function runAllTests(): Promise<void> {
  console.log('\n=== PostgreSQL + pgvector Test Suite ===\n');

  // Test 1: Connection
  console.log('1. Testing PostgreSQL connection...');
  const connectionTest = await testConnection();
  console.log('');

  if (!connectionTest.success) {
    console.log('✗ Connection failed. Cannot proceed with other tests.\n');
    return;
  }

  // Test 2: pgvector extension
  console.log('2. Checking pgvector extension...');
  const extensionTest = await checkPgvectorExtension();
  console.log('');

  // Test 3: Vector index
  console.log('3. Verifying vector index configuration...');
  const indexTest = await verifyVectorIndex();
  console.log('');

  // Test 4: Table stats
  console.log('4. Getting table statistics...');
  const statsTest = await getTableStats();
  console.log('');

  // Test 5: Vector search
  if (statsTest.totalRows && statsTest.totalRows > 0) {
    console.log('5. Testing vector search...');
    const searchTest = await testVectorSearch();
    console.log('');
  } else {
    console.log('5. Skipping vector search test (no data available)\n');
  }

  // Summary
  console.log('=== Test Summary ===');
  console.log(`Connection: ${connectionTest.success ? '✓' : '✗'}`);
  console.log(`pgvector extension: ${extensionTest.installed ? '✓' : '✗'}`);
  console.log(`Vector index: ${indexTest.exists && indexTest.usesCosinOps ? '✓' : '✗'}`);
  console.log(`Table stats: ${statsTest.success ? '✓' : '✗'}`);
  console.log(`Data rows: ${statsTest.totalRows || 0}`);
  console.log('');
}
