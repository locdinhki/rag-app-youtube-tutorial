# RAG Pipeline Documentation

## Overview

The RAG (Retrieval-Augmented Generation) pipeline enables semantic search and AI-powered question answering over uploaded Colorado tax lien documents.

## Pipeline Components

### 1. Retrieval Component

**File**: [lib/retrieval.ts](../lib/retrieval.ts)

**Functions**:

- `retrieveRelevantChunks(query, options)` - Performs semantic search
  - Generates embedding for user query
  - Queries PostgreSQL with cosine distance
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
  topK: 5,              // Number of chunks to retrieve
  county: undefined,    // Optional county filter
  minDistance: 0.5      // Maximum cosine distance
}
```

**Database Query**:
```sql
SELECT
  id, content, county, document_title,
  section_header, subsection_header,
  embedding <=> $1::vector AS distance
FROM document_chunks
WHERE county = $2
ORDER BY embedding <=> $1::vector
LIMIT $3
```

### 2. Answer Generation Component

**File**: [lib/answer-generation.ts](../lib/answer-generation.ts)

**Functions**:

- `generateAnswer(query, context, stream)` - Generates AI response
  - Creates system and user prompts
  - Calls OpenAI Chat Completion API
  - Supports streaming for real-time responses
  - Returns ReadableStream or complete string

**LLM Configuration**:
```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.1,
  max_tokens: 800,
  stream: true
}
```

**System Prompt Guidelines**:
- Answer based ONLY on provided context
- Cite sources for every fact
- Professional but friendly tone
- Specific with numbers, dates, procedures
- Never make up information

### 3. API Endpoint

**File**: [app/api/chat/route.ts](../app/api/chat/route.ts)

**Endpoint**: `POST /api/chat`

**Request Body**:
```typescript
{
  message: string,
  county?: string,
  conversationHistory?: Message[]
}
```

**Response Format** (Server-Sent Events):
```typescript
// Streaming tokens
data: { "type": "token", "content": "text..." }

// Completion signal
data: { "type": "complete" }

// Metadata with sources
data: {
  "type": "metadata",
  "sources": [...],
  "chunksUsed": 3
}
```

## Query Flow

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

## Configuration Parameters

### Distance Threshold

The `minDistance` parameter controls similarity:

- `0.0` - Identical (very strict)
- `0.5` - **Default** - Good balance
- `1.0` - More lenient
- `1.2` - Maximum threshold

Lower values = stricter matching, fewer but more relevant results

### Top K Results

The `topK` parameter controls chunk count:

- `3` - Minimum for basic context
- `5` - **Default** - Good balance
- `10` - More comprehensive context
- `20` - Maximum before context becomes too large

### LLM Parameters

**Model**: `gpt-4o-mini`
- Cost-effective ($0.15/1M input, $0.60/1M output)
- Fast response times
- High quality for factual Q&A

**Temperature**: `0.1`
- Low for factual consistency
- Minimizes hallucinations
- Produces deterministic answers

**Max Tokens**: `800`
- ~600 words typical response
- Prevents overly long answers
- Keeps costs manageable

## Testing

### Unit Test

**File**: [test-rag-pipeline.ts](../test-rag-pipeline.ts)

```bash
npx ts-node test-rag-pipeline.ts
```

Tests:
- Database connection
- Semantic search retrieval
- Context formatting
- Source extraction
- Answer generation

### API Test

**File**: [test-chat-api.ts](../test-chat-api.ts)

```bash
npm run dev
npx ts-node test-chat-api.ts
```

Tests:
- POST request to `/api/chat`
- Streaming response handling
- Source attribution
- Error handling

### Manual Testing

**GET endpoint**:
```bash
curl http://localhost:3000/api/chat
```

**POST with query**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the redemption period?"}'
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

## Error Handling

### User-Facing Errors

**No documents uploaded**:
```
I couldn't find any relevant information about "..." in the uploaded documents.
You may need to upload tax lien guidelines from the relevant county.
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
Invalid OpenAI API key. Check OPENAI_API_KEY environment variable.
```

## Performance Optimization

### Database
- ivfflat index for fast approximate nearest neighbor search
- Index configured with `lists = 100`
- County filter uses B-tree index

### Streaming
- Reduces perceived latency
- More efficient for long responses
- Better user experience

### Embedding Caching
- Query embeddings regenerated each time
- Document embeddings stored persistently
- Re-running same query uses stored document vectors

## Future Improvements

1. **Conversation History** - Maintain context across turns
2. **Hybrid Search** - Combine vector + keyword/BM25
3. **Re-ranking** - Use re-ranker model for quality
4. **Query Expansion** - Auto-expand with synonyms
5. **Caching** - Cache frequent queries
6. **Analytics** - Track patterns and quality
7. **Feedback Loop** - User ratings to improve retrieval
