import { NextRequest, NextResponse } from 'next/server';
import { getPostgresClient } from '@/lib/db/postgres-client';

/**
 * DELETE /api/documents/[id]
 *
 * Deletes a document and all its associated chunks from the database
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let client;

  try {
    const { id: documentId } = await context.params;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    client = await getPostgresClient();

    // First, check if document exists
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM document_chunks
      WHERE document_id = $1
    `;

    const checkResult = await client.query(checkQuery, [documentId]);
    const chunkCount = parseInt(checkResult.rows[0].count, 10);

    if (chunkCount === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete all chunks for this document
    const deleteQuery = `
      DELETE FROM document_chunks
      WHERE document_id = $1
    `;

    await client.query(deleteQuery, [documentId]);

    console.log(`[api/documents/delete] Deleted ${chunkCount} chunks for document ${documentId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted document and ${chunkCount} associated chunks`,
      chunksDeleted: chunkCount,
    });
  } catch (error) {
    console.error('[api/documents/delete] Error deleting document:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete document',
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
