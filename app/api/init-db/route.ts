import { NextResponse } from 'next/server';
import { initDatabase, testConnection } from '@/lib/db/postgres-client';

/**
 * POST /api/init-db
 *
 * Initializes the database with required tables and indexes
 * This should be called once before using the application
 */
export async function POST() {
  try {
    console.log('[init-db] Starting database initialization...');

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to connect to database. Please check your DATABASE_URL environment variable.',
        },
        { status: 503 }
      );
    }

    // Initialize database
    await initDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['document_chunks'],
      indexes: [
        'document_chunks_embedding_idx (vector cosine)',
        'document_chunks_county_idx',
        'document_chunks_document_id_idx',
      ],
      extensions: ['pgvector'],
    });
  } catch (error) {
    console.error('[init-db] Error initializing database:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/init-db
 *
 * Returns information about the database initialization endpoint
 */
export async function GET() {
  return NextResponse.json({
    name: 'Database Initialization API',
    description: 'Initialize the database with required tables and indexes',
    endpoint: '/api/init-db',
    method: 'POST',
    note: 'This should be called once before using the application',
  });
}
