import { ColoradoCounty, UploadedDocument } from './types';

/**
 * API Response Types
 */

export interface UploadResponse {
  success: boolean;
  documentId?: string;
  chunkCount?: number;
  vectorCount?: number;
  sections?: string[];
  message?: string;
  error?: string;
}

export interface ChatSource {
  county: string;
  documentTitle: string;
  section?: string;
}

export interface ChatMetadata {
  type: 'metadata';
  sources: ChatSource[];
  chunksUsed: number;
}

export interface DocumentsResponse {
  documents: UploadedDocument[];
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Custom Error Types
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Retry utility with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on 4xx errors (client errors)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Upload a document to the server
 *
 * @param file - The markdown file to upload
 * @param metadata - Document metadata (county, title, year)
 * @returns Promise with upload response
 */
export async function uploadDocument(
  file: File,
  metadata: { county: ColoradoCounty; title: string; year: number }
): Promise<UploadResponse> {
  return retryWithBackoff(async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('county', metadata.county);
    formData.append('documentTitle', metadata.title);
    formData.append('year', metadata.year.toString());

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || 'Upload failed',
        response.status,
        data.details
      );
    }

    return data;
  });
}

/**
 * Send a chat message and receive streaming response
 *
 * @param message - The user's message
 * @param options - Optional filters (county)
 * @returns ReadableStream of response chunks
 */
export async function sendChatMessage(
  message: string,
  options?: { county?: string }
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      county: options?.county,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new APIError(
      data.error || 'Chat request failed',
      response.status,
      data.details
    );
  }

  if (!response.body) {
    throw new NetworkError('Response body is null');
  }

  return response.body;
}

/**
 * Parse SSE (Server-Sent Events) stream from chat API
 *
 * @param stream - ReadableStream from sendChatMessage
 * @param onToken - Callback for each text token
 * @param onMetadata - Callback for metadata (sources, chunk count)
 * @param onError - Callback for errors
 */
export async function parseChatStream(
  stream: ReadableStream<Uint8Array>,
  callbacks: {
    onToken: (token: string) => void;
    onMetadata: (metadata: ChatMetadata) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
  }
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        callbacks.onComplete?.();
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages (separated by \n\n)
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        // SSE format: "data: {json}" or plain text
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6); // Remove "data: " prefix

          try {
            const data = JSON.parse(dataStr);

            // Check if this is metadata
            if (data.type === 'metadata') {
              callbacks.onMetadata(data as ChatMetadata);
            } else if (data.type === 'token' && data.content) {
              // Extract content from token
              callbacks.onToken(data.content);
            } else if (data.type === 'complete') {
              // Completion signal - do nothing, will be handled by onComplete
            } else {
              // Unknown data type, treat as plain text
              callbacks.onToken(JSON.stringify(data));
            }
          } catch {
            // Not JSON, treat as plain text token
            callbacks.onToken(dataStr);
          }
        } else {
          // Plain text token
          callbacks.onToken(line);
        }
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown streaming error');
    callbacks.onError?.(err);
    throw err;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fetch all uploaded documents
 *
 * @returns Promise with array of documents
 */
export async function fetchDocuments(): Promise<UploadedDocument[]> {
  return retryWithBackoff(async () => {
    const response = await fetch('/api/documents');

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Failed to fetch documents' }));
      throw new APIError(
        data.error || 'Failed to fetch documents',
        response.status,
        data.details
      );
    }

    const data = await response.json();

    // Transform uploadedAt from string to Date object
    const documents: UploadedDocument[] = (data.documents || []).map((doc: UploadedDocument) => ({
      ...doc,
      uploadedAt: new Date(doc.uploadedAt),
    }));

    return documents;
  });
}

/**
 * Delete a document by ID
 *
 * @param documentId - The document ID to delete
 * @returns Promise with delete response
 */
export async function deleteDocument(documentId: string): Promise<DeleteResponse> {
  return retryWithBackoff(async () => {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || 'Failed to delete document',
        response.status,
        data.details
      );
    }

    return data;
  });
}
