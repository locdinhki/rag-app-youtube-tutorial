import { NextRequest, NextResponse } from "next/server";
import { processMarkdownDocument } from "@/lib/md-processor";
import { RAG_CONFIG } from "@/lib/constants";
import { ColoradoCounty, COLORADO_COUNTIES } from "@/lib/types";
import { initDatabase } from "@/lib/db/postgres-client";
import { storeDocumentChunks } from "@/lib/db/vector-store";

/**
 * POST /api/upload
 * Handles markdown file uploads and processes them into chunks
 *
 * Expected form data:
 * - file: MD/Markdown file
 * - county: Colorado county name
 * - documentTitle: Title of the document
 * - year: Year of the document
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    // Extract fields
    const file = formData.get("file") as File | null;
    const county = formData.get("county") as string | null;
    const documentTitle = formData.get("documentTitle") as string | null;
    const yearStr = formData.get("year") as string | null;

    // Validate all required fields are present
    if (!file || !county || !documentTitle || !yearStr) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields. Expected: file, county, documentTitle, year",
        },
        { status: 400 }
      );
    }

    // Validate file is provided
    if (!file.name) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExtension = file.name.toLowerCase().split(".").pop();
    if (fileExtension !== "md" && fileExtension !== "markdown") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file format (must be .md or .markdown)",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > RAG_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File is too large (max ${RAG_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB)`,
        },
        { status: 400 }
      );
    }

    // Validate county is a valid Colorado county
    if (!COLORADO_COUNTIES.includes(county as ColoradoCounty)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid county. Must be one of: ${COLORADO_COUNTIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate year is a valid number
    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 1900 || year > 2100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid year. Must be a number between 1900 and 2100",
        },
        { status: 400 }
      );
    }

    // Log upload details
    console.log(`[upload] Processing file: ${file.name}`);
    console.log(`[upload] File size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`[upload] County: ${county}, Title: ${documentTitle}, Year: ${year}`);

    // Read file content as UTF-8 text
    let fileContent: string;
    try {
      const buffer = await file.arrayBuffer();
      fileContent = new TextDecoder("utf-8").decode(buffer);
    } catch (error) {
      console.error("[upload] Error reading file:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read file content",
        },
        { status: 500 }
      );
    }

    // Validate content is not empty
    if (fileContent.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "File content is empty",
        },
        { status: 400 }
      );
    }

    // Generate document ID before processing
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Process the document into chunks
    let chunks;
    try {
      chunks = processMarkdownDocument(
        fileContent,
        {
          county: county as ColoradoCounty,
          title: documentTitle,
          year: year,
        },
        documentId
      );
    } catch (error) {
      console.error("[upload] Error processing document:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        {
          success: false,
          error: `Failed to process document: ${errorMessage}`,
        },
        { status: 500 }
      );
    }

    // Log chunk information with section headers visible
    console.log(`[upload] Successfully created ${chunks.length} chunks`);

    chunks.forEach((chunk, index) => {
      const sectionInfo = chunk.metadata.sectionHeader
        ? ` [${chunk.metadata.sectionHeader}${chunk.metadata.subsectionHeader ? ` > ${chunk.metadata.subsectionHeader}` : ""}]`
        : "";
      console.log(
        `[upload] Chunk ${index + 1}/${chunks.length}${sectionInfo}: ${chunk.content.substring(0, 100)}...`
      );
    });

    // Extract unique sections for response
    const sections = Array.from(
      new Set(chunks.map((c) => c.metadata.sectionHeader).filter(Boolean))
    );

    // Initialize database (creates tables and indexes if they don't exist)
    try {
      console.log("[upload] Initializing database...");
      await initDatabase();
    } catch (error) {
      console.error("[upload] Error initializing database:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        {
          success: false,
          error: `Failed to initialize database: ${errorMessage}`,
        },
        { status: 503 }
      );
    }

    // Store chunks with embeddings in PostgreSQL
    let storeResult;
    try {
      console.log("[upload] Storing document chunks with embeddings...");
      storeResult = await storeDocumentChunks(chunks);

      if (!storeResult.success) {
        throw new Error(storeResult.error || "Failed to store document chunks");
      }
    } catch (error) {
      console.error("[upload] Error storing document chunks:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        {
          success: false,
          error: `Failed to store document vectors: ${errorMessage}`,
        },
        { status: 500 }
      );
    }

    console.log(
      `[upload] Successfully stored ${storeResult.vectorCount} vectors in PostgreSQL`
    );

    return NextResponse.json(
      {
        success: true,
        documentId,
        chunkCount: chunks.length,
        vectorCount: storeResult.vectorCount,
        sections,
        message: `Successfully processed and stored ${chunks.length} chunks from ${sections.length} sections`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[upload] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Unexpected error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
