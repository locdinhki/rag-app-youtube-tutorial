import { NextRequest, NextResponse } from 'next/server';
import { getPostgresClient } from '@/lib/db/postgres-client';
import { UploadedDocument, ColoradoCounty } from '@/lib/types';

/**
 * GET /api/documents
 *
 * Fetches all uploaded documents with metadata
 * Groups chunks by document_id and returns unique documents with chunk counts
 */
export async function GET() {
  let client;

  try {
    client = await getPostgresClient();

    // Query to get unique documents with metadata and chunk counts
    const query = `
      SELECT
        document_id,
        county,
        document_title,
        year,
        COUNT(*) as chunk_count,
        MIN(created_at) as uploaded_at
      FROM document_chunks
      GROUP BY document_id, county, document_title, year
      ORDER BY MIN(created_at) DESC
    `;

    const result = await client.query(query);

    // Transform database rows into UploadedDocument format
    const documents: UploadedDocument[] = result.rows.map((row: {
      document_id: string;
      county: string;
      document_title: string;
      year: number;
      chunk_count: string;
      uploaded_at: Date;
    }) => ({
      id: row.document_id,
      fileName: `${row.document_title.toLowerCase().replace(/\s+/g, '-')}.md`,
      county: row.county as ColoradoCounty,
      title: row.document_title,
      year: row.year,
      fileSize: 0, // We don't store original file size, so set to 0
      uploadedAt: new Date(row.uploaded_at),
      chunksProcessed: parseInt(row.chunk_count, 10),
    }));

    return NextResponse.json({
      documents,
    });
  } catch (error) {
    console.error('[api/documents] Error fetching documents:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch documents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
