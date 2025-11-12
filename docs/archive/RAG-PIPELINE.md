# RAG Pipeline Documentation

## Overview

The RAG (Retrieval-Augmented Generation) pipeline enables semantic search and AI-powered question answering over uploaded Colorado tax lien documents.

## Architecture

The pipeline consists of three main components:

1. **Retrieval** ([lib/retrieval.ts](lib/retrieval.ts)) - Semantic search using pgvector
2. **Answer Generation** ([lib/answer-generation.ts](lib/answer-generation.ts)) - LLM-powered response generation
3. **API Endpoint** ([app/api/chat/route.ts](app/api/chat/route.ts)) - HTTP interface for chat queries

## How It Works

### 1. User Query Flow

```
User Query
    ↓
Embedding Generation (OpenAI text-embedding-3-small)
    ↓
Vector Similarity Search (PostgreSQL + pgvector)
    ↓
Context Formatting
    ↓
LLM Response Generation (GPT-4o-mini)
    ↓
Streaming Response to User
```

### 2. Retrieval Component

**File**: [lib/retrieval.ts](lib/retrieval.ts)

**Key Functions**:

- `retrieveRelevantChunks(query, options)` - Performs semantic search
  - Generates embedding for user query
  - Queries PostgreSQL with cosine distance (`<=>` operator)
  - Filters by county (optional)
  - Returns top K most similar chunks
  - Filters out results above distance threshold

- `formatContextForLLM(chunks)` - Formats retrieved chunks
  - Structures chunks with source attribution
  - Includes county, document title, and section headers
  - Creates readable context for the LLM

- `extractSources(chunks)` - Extracts unique sources
  - Deduplicates sources across chunks
  - Returns array of source attributions

**Configuration**:
```typescript
{
  topK: 5,              // Number of chunks to retrieve (default)
  county: undefined,    // Optional county filter
  minDistance: 0.5      // Maximum cosine distance (lower = more similar)
}
```

**Database Query**:
```sql
SELECT
  id, content, county, document_title,
  section_header, subsection_header,
  embedding <=> $1::vector AS distance
FROM document_chunks
WHERE county = $2  -- Optional filter
ORDER BY embedding <=> $1::vector
LIMIT $3
```

### 3. Answer Generation Component

**File**: [lib/answer-generation.ts](lib/answer-generation.ts)

**Key Functions**:

- `generateAnswer(query, context, stream)` - Generates AI response
  - Creates system and user prompts
  - Calls OpenAI Chat Completion API
  - Supports streaming for real-time responses
  - Returns ReadableStream or complete string

- `generateAnswerSync(query, context)` - Non-streaming version
  - Useful for testing and batch processing
  - Returns complete answer string

**LLM Configuration**:
```typescript
{
  model: 'gpt-4o-mini',     // Cost-effective and fast
  temperature: 0.1,          // Low for factual consistency
  max_tokens: 800,           // Reasonable response length
  stream: true               // Enable real-time streaming
}
```

**System Prompt**:
The LLM is instructed to:
- Answer based ONLY on provided context
- Cite sources for every fact
- Use professional but friendly tone
- Be specific with numbers, dates, and procedures
- Never make up information

### 4. API Endpoint

**File**: [app/api/chat/route.ts](app/api/chat/route.ts)

**Endpoint**: `POST /api/chat`

**Request Body**:
```typescript
{
  message: string,                    // Required: User's question
  county?: string,                    // Optional: Filter by county
  conversationHistory?: Message[]     // Optional: Previous messages
}
```

**Response Format** (Server-Sent Events):
```typescript
// Streaming tokens
data: { "type": "token", "content": "In Boulder County..." }
data: { "type": "token", "content": " the redemption" }
...

// Completion signal
data: { "type": "complete" }

// Metadata with sources
data: {
  "type": "metadata",
  "sources": [
    {
      "county": "Boulder",
      "documentTitle": "Redemption Guidelines 2024",
      "section": "Redemption Period"
    }
  ],
  "chunksUsed": 3
}
```

**Error Handling**:
- `400` - Invalid request (missing message, invalid JSON)
- `500` - Retrieval failure, LLM failure, or database error
- `200` - Success (even if no chunks found - returns helpful message)

### 5. Pipeline Flow

```typescript
// 1. Receive query
const { message, county } = request.body;

// 2. Retrieve relevant chunks
const chunks = await retrieveRelevantChunks(message, { county, topK: 5 });

// 3. Handle no results
if (chunks.length === 0) {
  return { message: "No relevant information found...", sources: [] };
}

// 4. Format context
const context = formatContextForLLM(chunks);

// 5. Generate streaming answer
const stream = await generateAnswer(message, context, true);

// 6. Extract and include sources
const sources = extractSources(chunks);

// 7. Stream response with metadata
return streamWithMetadata(stream, sources, chunks.length);
```

## Configuration

### Distance Threshold

The `minDistance` parameter controls how similar chunks must be to the query:

- `0.0` - Identical (very strict)
- `0.5` - **Default** - Good balance
- `1.0` - More lenient
- `1.2` - Maximum threshold (from RAG_CONFIG)

Lower values = stricter matching, fewer but more relevant results
Higher values = looser matching, more results but potentially less relevant

### Top K Results

The `topK` parameter controls how many chunks to retrieve:

- `3` - Minimum for basic context
- `5` - **Default** - Good balance
- `10` - More comprehensive context
- `20` - Maximum before context becomes too large

More chunks = more comprehensive but longer context and higher LLM costs

### LLM Parameters

**Model**: `gpt-4o-mini`
- Cost-effective ($0.15/1M input tokens, $0.60/1M output tokens)
- Fast response times
- High quality for factual Q&A

**Temperature**: `0.1`
- Low temperature for factual consistency
- Minimizes hallucinations
- Produces deterministic answers

**Max Tokens**: `800`
- ~600 words typical response
- Prevents overly long answers
- Keeps costs manageable

## Testing

### 1. Unit Test (Direct Function Calls)

**File**: [test-rag-pipeline.ts](test-rag-pipeline.ts)

```bash
npx ts-node test-rag-pipeline.ts
```

Tests each component individually:
- Database connection
- Semantic search retrieval
- Context formatting
- Source extraction
- Answer generation (non-streaming)

### 2. API Test (HTTP Endpoint)

**File**: [test-chat-api.ts](test-chat-api.ts)

**Prerequisites**: Start dev server first
```bash
npm run dev
```

Then run the test:
```bash
npx ts-node test-chat-api.ts
```

Tests the complete pipeline:
- POST request to `/api/chat`
- Streaming response handling
- Source attribution
- Error handling

### 3. Manual Testing with curl

**GET endpoint** (API info):
```bash
curl http://localhost:3000/api/chat
```

**POST endpoint** (Query):
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the redemption period in Boulder County?"
  }'
```

**With county filter**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the interest rates?",
    "county": "Boulder"
  }'
```

## Logging

The pipeline includes comprehensive logging:

### Retrieval Logs
```
Query: "What is the redemption period?"
Retrieval options: topK=5, county=all, minDistance=0.5
Retrieved 3 chunks (distances: 0.234, 0.298, 0.412)
```

### Answer Generation Logs
```
Generating answer (streaming: true)...
Generated response (456 characters)
```

### API Logs
```
=== Chat API Request ===
Query: "What is the redemption period?"
County filter: none
Found 3 relevant chunks
```

## Error Messages

### User-Facing Errors

**No documents uploaded**:
```
I couldn't find any relevant information about "..." in the uploaded documents.
You may need to upload tax lien guidelines from the relevant county.
```

**County-specific no results**:
```
I couldn't find any relevant information about "..." in the uploaded documents
from Boulder County. You may need to upload Boulder County tax lien guidelines
or try searching without the county filter.
```

**Invalid request**:
```json
{
  "error": "Message is required and must be a non-empty string"
}
```

### Technical Errors

**Database not initialized**:
```
Database not initialized. Please upload documents first.
```

**OpenAI API error**:
```
Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.
```

**Rate limit**:
```
OpenAI rate limit exceeded. Please try again later.
```

## Performance Considerations

### Database Queries
- Uses `ivfflat` index for fast approximate nearest neighbor search
- Index configured with `lists = 100` for balance of speed and accuracy
- County filter uses separate B-tree index

### Streaming
- Reduces perceived latency by showing partial results immediately
- More efficient for long responses
- Better user experience

### Embedding Caching
- Query embeddings are NOT cached (they're unique)
- Document embeddings are stored in database (persistent)
- Re-running same query will re-generate embedding but use same document vectors

## Future Improvements

1. **Conversation History**: Use conversationHistory parameter to maintain context across turns
2. **Hybrid Search**: Combine vector similarity with keyword/BM25 search
3. **Re-ranking**: Use a re-ranker model to improve result quality
4. **Query Expansion**: Automatically expand queries with synonyms/related terms
5. **Caching**: Cache frequent queries to reduce costs
6. **Analytics**: Track query patterns and retrieval quality
7. **Feedback Loop**: Allow users to rate answers and improve retrieval

## Dependencies

- `openai` - Embeddings and LLM inference
- `pg` - PostgreSQL client
- `pgvector` - Vector similarity search
- Next.js App Router - API routes with streaming support

## Environment Variables

```bash
OPENAI_API_KEY=sk-...           # Required for embeddings and LLM
DATABASE_URL=postgresql://...   # Required for pgvector storage
```

## Files Created

1. [lib/retrieval.ts](lib/retrieval.ts) - Semantic search functions (239 lines)
2. [lib/answer-generation.ts](lib/answer-generation.ts) - LLM response generation (159 lines)
3. [app/api/chat/route.ts](app/api/chat/route.ts) - API endpoint (175 lines)
4. [test-rag-pipeline.ts](test-rag-pipeline.ts) - Unit tests (126 lines)
5. [test-chat-api.ts](test-chat-api.ts) - API integration tests (105 lines)

## Summary

The RAG pipeline is production-ready with:
- ✅ Semantic search using pgvector
- ✅ Streaming responses for better UX
- ✅ Source attribution for transparency
- ✅ County filtering for targeted search
- ✅ Comprehensive error handling
- ✅ Extensive logging for debugging
- ✅ TypeScript type safety
- ✅ Test scripts for validation

To use it, simply POST to `/api/chat` with a message and optional county filter, and receive a streaming response with cited sources.
