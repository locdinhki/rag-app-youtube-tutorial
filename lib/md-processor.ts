import { RAG_CONFIG } from "./constants";
import {
  DocumentMetadata,
  DocumentChunk,
  MarkdownSection,
} from "./types";
import { randomUUID } from "crypto";

/**
 * Parse markdown structure to extract all headers and their content
 * Identifies H1, H2, H3 headers and their positions in the document
 */
export function parseMarkdownStructure(content: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  const lines = content.split("\n");

  let currentPosition = 0;
  const headerPositions: Array<{
    level: number;
    title: string;
    position: number;
    lineIndex: number;
  }> = [];

  // First pass: find all headers and their positions
  lines.forEach((line, index) => {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h3Match) {
      headerPositions.push({
        level: 3,
        title: h3Match[1].trim(),
        position: currentPosition,
        lineIndex: index,
      });
    } else if (h2Match) {
      headerPositions.push({
        level: 2,
        title: h2Match[1].trim(),
        position: currentPosition,
        lineIndex: index,
      });
    } else if (h1Match) {
      headerPositions.push({
        level: 1,
        title: h1Match[1].trim(),
        position: currentPosition,
        lineIndex: index,
      });
    }

    currentPosition += line.length + 1; // +1 for newline
  });

  // Second pass: create sections with content
  headerPositions.forEach((header, index) => {
    const startLine = header.lineIndex + 1; // Content starts after header
    const endLine =
      index < headerPositions.length - 1
        ? headerPositions[index + 1].lineIndex
        : lines.length;

    const sectionContent = lines.slice(startLine, endLine).join("\n").trim();
    const endPosition =
      index < headerPositions.length - 1
        ? headerPositions[index + 1].position
        : content.length;

    // Only include sections with non-empty content
    if (sectionContent.length > 0) {
      sections.push({
        level: header.level,
        title: header.title,
        content: sectionContent,
        startPosition: header.position,
        endPosition: endPosition,
      });
    }
  });

  return sections;
}

/**
 * Split text into chunks at sentence boundaries
 * Ensures no mid-sentence splits
 */
function splitOnSentences(text: string, maxSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Split on sentence boundaries (., !, ?) followed by space or newline
  const sentences = text.match(/[^.!?]+[.!?]+|\n+|[^.!?\n]+$/g) || [text];

  for (const sentence of sentences) {
    if (
      currentChunk.length + sentence.length > maxSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Split text into chunks at paragraph boundaries
 * Falls back to sentence boundaries if paragraphs are too large
 */
function splitOnParagraphs(text: string, maxSize: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) continue;

    if (paragraph.length > maxSize) {
      // Paragraph too large, split on sentences
      const sentenceChunks = splitOnSentences(paragraph, maxSize);
      chunks.push(...sentenceChunks);
    } else if (
      chunks.length > 0 &&
      chunks[chunks.length - 1].length + paragraph.length < maxSize
    ) {
      // Append to previous chunk if it fits
      chunks[chunks.length - 1] += "\n\n" + paragraph;
    } else {
      // Start new chunk
      chunks.push(paragraph);
    }
  }

  return chunks;
}

/**
 * Intelligently chunk a markdown document based on structure
 * Prefers H2 boundaries, falls back to H3, then paragraphs
 * Implements overlapping chunks to preserve context
 */
export function chunkMarkdownDocument(
  content: string,
  metadata: DocumentMetadata,
  documentId: string
): DocumentChunk[] {
  const sections = parseMarkdownStructure(content);
  const chunks: DocumentChunk[] = [];
  let previousChunkEnd = "";

  // If no sections found, treat entire document as one section
  if (sections.length === 0) {
    const textChunks = splitOnParagraphs(content, RAG_CONFIG.CHUNK_SIZE);

    textChunks.forEach((chunkContent, index) => {
      // Add overlap from previous chunk
      const contentWithOverlap =
        index > 0 ? previousChunkEnd + chunkContent : chunkContent;

      chunks.push({
        id: randomUUID(),
        documentId: documentId,
        content: contentWithOverlap,
        metadata: {
          ...metadata,
          documentTitle: metadata.title,
          chunkIndex: index,
          totalChunks: textChunks.length,
        },
      });

      // Store last N characters for next chunk
      previousChunkEnd = chunkContent.slice(-RAG_CONFIG.CHUNK_OVERLAP);
    });

    return chunks;
  }

  // Process sections hierarchically
  let currentH2: string | undefined;
  let sectionChunkCount = 0;
  let isFirstChunkOfSection = true;

  sections.forEach((section) => {
    // Track H2 headers for context
    if (section.level === 2) {
      currentH2 = section.title;
      isFirstChunkOfSection = true;
    }

    // Determine if section needs to be split
    if (section.content.length <= RAG_CONFIG.CHUNK_SIZE) {
      // Section fits in one chunk
      let chunkContent = section.content;

      // Add context prefix for first chunk of section
      if (isFirstChunkOfSection && currentH2) {
        const contextPrefix =
          section.level === 3
            ? `[Context: ${currentH2} > ${section.title}]\n\n`
            : `[Context: ${section.title}]\n\n`;
        chunkContent = contextPrefix + chunkContent;
      }

      // Add overlap from previous chunk
      const contentWithOverlap =
        chunks.length > 0 ? previousChunkEnd + chunkContent : chunkContent;

      chunks.push({
        id: randomUUID(),
        documentId: documentId,
        content: contentWithOverlap,
        metadata: {
          ...metadata,
          documentTitle: metadata.title,
          chunkIndex: chunks.length,
          totalChunks: 0, // Will update at the end
          sectionHeader: section.level === 2 ? section.title : currentH2,
          subsectionHeader: section.level === 3 ? section.title : undefined,
        },
      });

      // Store last N characters for next chunk
      previousChunkEnd = section.content.slice(-RAG_CONFIG.CHUNK_OVERLAP);
      isFirstChunkOfSection = false;
      sectionChunkCount = 1;
    } else {
      // Section too large, split it
      const textChunks = splitOnParagraphs(
        section.content,
        RAG_CONFIG.CHUNK_SIZE
      );

      textChunks.forEach((chunkContent, index) => {
        // Add context prefix only to first chunk of section
        if (index === 0 && isFirstChunkOfSection && currentH2) {
          const contextPrefix =
            section.level === 3
              ? `[Context: ${currentH2} > ${section.title}]\n\n`
              : `[Context: ${section.title}]\n\n`;
          chunkContent = contextPrefix + chunkContent;
        }

        // Add overlap from previous chunk
        const contentWithOverlap =
          chunks.length > 0 || index > 0
            ? previousChunkEnd + chunkContent
            : chunkContent;

        // Skip chunks that are too small (unless it's the only chunk)
        if (
          contentWithOverlap.length >= RAG_CONFIG.MIN_CHUNK_SIZE ||
          textChunks.length === 1
        ) {
          chunks.push({
            id: randomUUID(),
            documentId: documentId,
            content: contentWithOverlap,
            metadata: {
              ...metadata,
              documentTitle: metadata.title,
              chunkIndex: chunks.length,
              totalChunks: 0, // Will update at the end
              sectionHeader: section.level === 2 ? section.title : currentH2,
              subsectionHeader: section.level === 3 ? section.title : undefined,
            },
          });

          // Store last N characters for next chunk
          previousChunkEnd = chunkContent.slice(-RAG_CONFIG.CHUNK_OVERLAP);
        }

        if (index === 0) {
          isFirstChunkOfSection = false;
        }
      });

      sectionChunkCount = textChunks.length;
    }

    // Log warning for very large sections
    if (sectionChunkCount > 5) {
      console.warn(
        `[md-processor] Large section "${section.title}" split into ${sectionChunkCount} chunks`
      );
    }
  });

  // Update totalChunks for all chunks
  chunks.forEach((chunk, index) => {
    chunk.metadata.chunkIndex = index;
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

/**
 * Main orchestration function for processing markdown documents
 * Parses structure, chunks content, and adds metadata
 */
export function processMarkdownDocument(
  fileContent: string,
  metadata: DocumentMetadata,
  documentId: string
): DocumentChunk[] {
  // Validate content is not empty
  if (fileContent.trim().length === 0) {
    throw new Error("Document content is empty");
  }

  // Parse and chunk the document
  const chunks = chunkMarkdownDocument(fileContent, metadata, documentId);

  // Log processing results
  console.log(`[md-processor] Processed document: ${metadata.title}`);
  console.log(`[md-processor] County: ${metadata.county}, Year: ${metadata.year}`);
  console.log(`[md-processor] Created ${chunks.length} chunks`);

  // Log section headers for debugging
  const uniqueSections = new Set(
    chunks.map((c) => c.metadata.sectionHeader).filter(Boolean)
  );
  console.log(
    `[md-processor] Sections detected: ${Array.from(uniqueSections).join(", ")}`
  );

  return chunks;
}
