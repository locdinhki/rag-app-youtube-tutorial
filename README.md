# Tax Lien RAG Assistant

An intelligent research assistant powered by RAG (Retrieval-Augmented Generation) to help you find and understand Colorado tax lien information quickly and accurately.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## Features

### 📤 Document Upload & Processing
- **Drag-and-drop interface** - Easy file upload with visual feedback
- **Markdown support** - Upload .md files with tax lien documentation
- **Metadata management** - Tag documents with county, title, and year
- **Document preview** - See headers and content before uploading
- **File validation** - Automatic size and format checking
- **Document library** - View, filter, and manage uploaded documents

### 🔍 Intelligent Vector Search
- **Semantic search** - Find relevant information using meaning, not just keywords
- **pgvector integration** - Fast similarity search with PostgreSQL
- **County filtering** - Search within specific county documents
- **Relevance scoring** - Results ranked by similarity

### 💬 AI-Powered Chat Interface
- **Natural language queries** - Ask questions in plain English
- **Streaming responses** - Real-time answer generation
- **Source citations** - Every answer includes document references
- **Context-aware** - Answers based only on your uploaded documents
- **GPT-4o-mini powered** - Fast, accurate, and cost-effective

### 🎨 Modern UI/UX
- **Responsive design** - Works on desktop, tablet, and mobile
- **shadcn/ui components** - Beautiful, accessible components
- **Dark mode ready** - Color system supports dark theme
- **Smooth animations** - Polished interactions and transitions
- **Loading states** - Clear feedback during operations

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS v3, shadcn/ui |
| **Database** | PostgreSQL with pgvector extension |
| **Vector Store** | pgvector for embeddings |
| **AI/ML** | OpenAI API (text-embedding-3-small, GPT-4o-mini) |
| **Hosting** | Railway-ready (or any Node.js host) |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension (recommended: [Neon](https://neon.tech))
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd YT-rag-tutorial
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
DATABASE_URL=postgresql://user:password@host:port/database
```

4. **Initialize the database**
```bash
psql $DATABASE_URL -f lib/db/schema.sql
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3000
```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Project Structure

```
tax-lien-rag/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── chat/           # Chat endpoint (RAG pipeline)
│   │   ├── documents/      # Document CRUD operations
│   │   ├── init-db/        # Database initialization
│   │   └── upload/         # File upload processing
│   ├── chat/               # Chat interface page
│   ├── upload/             # Upload interface page
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Home/landing page
│   └── globals.css         # Global styles + Tailwind
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── document-upload.tsx # Upload form component
│   └── document-list.tsx   # Document management grid
├── lib/                    # Core utilities
│   ├── db/                 # Database utilities
│   │   ├── client.ts       # PostgreSQL connection pool
│   │   └── schema.sql      # Database schema
│   ├── answer-generation.ts # LLM response generation
│   ├── retrieval.ts        # Semantic search with pgvector
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Helper functions
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # System architecture
│   ├── RAG-PIPELINE.md     # RAG implementation details
│   ├── UPLOAD-FEATURE.md   # Upload feature docs
│   ├── SETUP.md            # Setup instructions
│   └── TAILWIND.md         # Styling guide
└── sample-documents/       # Sample markdown files
```

## How It Works

### 1. Document Upload
```
User uploads markdown file
    ↓
Parse and extract metadata
    ↓
Split into semantic chunks
    ↓
Generate embeddings (OpenAI)
    ↓
Store in PostgreSQL with pgvector
```

### 2. Question Answering
```
User asks a question
    ↓
Generate query embedding
    ↓
Vector similarity search (pgvector)
    ↓
Retrieve top K relevant chunks
    ↓
Format context for LLM
    ↓
Generate answer (GPT-4o-mini)
    ↓
Stream response with citations
```

## Key Features Explained

### Vector Search with pgvector

Uses PostgreSQL's pgvector extension for efficient similarity search:
- **1536-dimensional embeddings** (OpenAI text-embedding-3-small)
- **Cosine distance** for similarity measurement
- **ivfflat index** for fast approximate nearest neighbor search
- **County filtering** with combined vector + metadata queries

### RAG Pipeline

Custom implementation following best practices:
- **Semantic chunking** - Intelligent document splitting
- **Retrieval** - Top K most relevant chunks (configurable)
- **Context formatting** - Structured prompts for LLM
- **Streaming responses** - Real-time answer generation
- **Source attribution** - Transparent citations

### Upload System

Full-featured document management:
- **Drag-and-drop** - Intuitive file selection
- **Metadata forms** - County, title, year tagging
- **Preview** - See content and headers before upload
- **Validation** - File type and size checking
- **Grid view** - Browse and manage documents
- **County filtering** - Filter by jurisdiction
- **Delete protection** - Confirmation dialogs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload and process documents |
| `POST` | `/api/chat` | Ask questions (RAG query) |
| `GET` | `/api/documents` | List all documents |
| `DELETE` | `/api/documents/:id` | Delete a document |
| `POST` | `/api/init-db` | Initialize database schema |

## Configuration

### RAG Parameters

Edit [lib/retrieval.ts](lib/retrieval.ts) to adjust:

```typescript
{
  topK: 5,              // Number of chunks to retrieve
  minDistance: 0.5,     // Similarity threshold (0-2)
  county: undefined     // Optional county filter
}
```

### LLM Settings

Edit [lib/answer-generation.ts](lib/answer-generation.ts):

```typescript
{
  model: 'gpt-4o-mini',   // OpenAI model
  temperature: 0.1,        // Lower = more factual
  max_tokens: 800          // Response length limit
}
```

## Documentation

Comprehensive documentation in the [docs/](docs/) folder:

- **[SETUP.md](docs/SETUP.md)** - Installation and configuration
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and structure
- **[RAG-PIPELINE.md](docs/RAG-PIPELINE.md)** - RAG implementation details
- **[UPLOAD-FEATURE.md](docs/UPLOAD-FEATURE.md)** - Upload system documentation
- **[TAILWIND.md](docs/TAILWIND.md)** - Styling and theming guide

## Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run Tests
```bash
# Test RAG pipeline
npx ts-node test-rag-pipeline.ts

# Test chat API (requires dev server running)
npx ts-node test-chat-api.ts
```

### Database Commands
```bash
# Initialize schema
psql $DATABASE_URL -f lib/db/schema.sql

# Check tables
psql $DATABASE_URL -c "\dt"

# View documents
psql $DATABASE_URL -c "SELECT county, document_title FROM document_chunks GROUP BY county, document_title;"
```

## Sample Documents

Test the app with included sample documents in [sample-documents/](sample-documents/):
- `boulder-redemption-2025.md` - Boulder County redemption guidelines
- `Clear_Creek_County_Tax_Lien_2025_FIXED.md` - Clear Creek County tax info

## Deployment

### Railway (Recommended)

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL database**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically provisions database with pgvector support
   - Connection string auto-populated in `DATABASE_URL`

4. **Add environment variables**
   - Go to your service → "Variables"
   - Add `OPENAI_API_KEY`
   - `DATABASE_URL` is already set by Railway

5. **Initialize database**
   - In Railway dashboard, open PostgreSQL
   - Go to "Query" tab
   - Run the schema from `lib/db/schema.sql`

6. **Deploy!**
   - Railway automatically deploys on push to main branch
   - Your app will be live at `your-app.railway.app`

### Other Platforms

Works on any Node.js hosting:
- Vercel (with external PostgreSQL)
- Fly.io
- Render
- AWS/GCP/Azure

Make sure to:
- Set environment variables
- Use production database with pgvector
- Configure connection pooling

## Roadmap

- [ ] User authentication
- [ ] Conversation history
- [ ] Multi-file batch upload
- [ ] Advanced search (hybrid vector + keyword)
- [ ] Document preview modal
- [ ] Export search results
- [ ] Usage analytics
- [ ] Dark mode toggle

## License

MIT

## Support

For questions or issues:
1. Check [docs/](docs/) folder
2. Review error logs
3. Verify environment variables
4. Check database connection

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [OpenAI](https://openai.com)
- [pgvector](https://github.com/pgvector/pgvector)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

## Claude Prompts

### PART 1: Project Setup
```markdown
Create a new Next.js 15 project with TypeScript for a tax lien RAG application called "tax-lien-rag". 

Setup requirements:
- Use Next.js 15 with App Router (not pages router)
- Install and configure Tailwind CSS v4 (latest version with new configuration)
- Install shadcn/ui and initialize it with default components
- Install these additional dependencies: 
  - pg (PostgreSQL client for Node.js)
  - @neondatabase/serverless (alternative PostgreSQL client, optional)
  - pgvector (PostgreSQL extension client for vectors)
  - openai
  - langchain
  - @langchain/openai
  - @langchain/community
  - gray-matter (for parsing markdown frontmatter)
- Create a clean folder structure:
  - /app (routes)
  - /components (React components)
  - /lib (utilities, RAG functions)
  - /lib/db (PostgreSQL client and operations)
- Configure Tailwind v4:
  - Use the new @tailwindcss/postcss plugin
  - Set up the new @import syntax in CSS
  - Configure with modern Tailwind v4 approach (no tailwind.config.js needed)
- Create .env.example with placeholder variables:
  - OPENAI_API_KEY=your_openai_key_here
  - DATABASE_URL=postgresql://user:password@host:port/database
- Add a simple home page with:
  - Heading "Tax Lien Research Assistant"
  - Subtitle explaining what the app does
  - Navigation links to /upload and /chat pages
- Create a basic layout with navigation header
- Add a note in README about PostgreSQL + pgvector being required
- Make sure the project runs with `npm run dev`

Important Notes:
- PostgreSQL will be a separate service on Railway
- pgvector extension provides vector similarity search in PostgreSQL
- We'll create a table for storing document chunks with embeddings
- Use Tailwind v4's new features and simplified configuration
```

### PART 2: Document Upload Interface
```markdown
Create a document upload page and components for Markdown files:

1. Create /app/upload/page.tsx with:
   - Page title "Upload County Documents"
   - Subtitle: "Upload markdown (.md) files containing tax lien redemption guidelines"
   - Import and use the upload component

2. Create /components/document-upload.tsx with:
   - Drag-and-drop file upload area:
     * Accept only .md and .markdown files
     * Show markdown icon and filename when selected
     * Visual feedback on drag-over (border color change)
     * Click to browse as alternative
   - Form fields for metadata:
     * County name dropdown with major Colorado counties:
       - Adams, Arapahoe, Boulder, Denver, Douglas, Clear Creek, Elbert, El Paso, Jefferson, Larimer, Pueblo, Weld
     * Document title text input (placeholder: "Redemption Guidelines 2025")
     * Year number input (default to current year 2025)
   - Preview section that appears after file selection:
     * Show first 500 characters of markdown content
     * Display file size
     * Show detected headers (H1, H2)
   - Upload button:
     * Disabled until file and all metadata fields are filled
     * Shows loading spinner and progress during upload
   - Success/error toast notifications
   - Clear/reset button to start over

3. Create /components/document-list.tsx with:
   - Grid/card-based layout showing uploaded documents
   - Each card displays:
     * County name with colored badge (Boulder: blue, Denver: purple, etc.)
     * Document title (bold, larger text)
     * Year and upload date (smaller, gray text)
     * Number of sections/chunks processed
     * Delete button with confirmation dialog
   - Filter dropdown to show documents by county
   - Empty state with helpful message and upload button:
     "No documents uploaded yet. Upload county guidelines to get started."
   - Loading skeleton while fetching documents

4. Style everything with Tailwind CSS v4 and shadcn/ui components:
   - Use Card, Button, Input, Select, Badge, Dialog from shadcn
   - Modern, clean design with proper spacing
   - Responsive layout (grid on desktop, stack on mobile)
   - Smooth transitions and hover effects
   - File upload area with dashed border and hover state
   - Leverage Tailwind v4's new features and simplified syntax

5. For now, make the upload button just log the file content and metadata to console. 
   We'll connect the actual API in the next step.

Add helpful UI hints:
- File size limit: "Max 5MB"
- Accepted format: "Markdown files (.md, .markdown)"
- Structure hint: "Files should contain structured sections with headers"
```

### PART 3: Chat Interface
```markdown
Create a chat interface for asking questions about tax lien documents:

1. Create /app/chat/page.tsx with:
   - Page title "Ask Questions"
   - Subtitle: "Ask anything about tax lien redemption in Colorado counties"
   - Full-height layout for chat experience
   - Import and use the chat components

2. Create /components/chat-interface.tsx with:
   - Message history display area:
     * User messages: right-aligned with blue background
     * AI messages: left-aligned with gray background
     * Source citations displayed below AI messages in smaller text:
       - County badge
       - Document name
       - Section header if available
     * Each message has timestamp
     * Scrollable container with auto-scroll to bottom
   - Clean, modern chat UI (similar to ChatGPT)
   - Smooth animations for new messages appearing
   
3. Create /components/chat-input.tsx with:
   - Text input field for questions:
     * Placeholder: "Ask about redemption periods, interest rates, required documents..."
     * Auto-resize as user types (up to 4 lines)
   - Send button with icon (paper plane)
   - Keyboard shortcuts:
     * Enter to send (Shift+Enter for new line)
     * Disable input and show "AI is thinking..." while waiting for response
   - Character count indicator (appears after 200 chars)
   - Optional: County filter dropdown above input
     "Search in: All Counties / Boulder / Denver / etc."

4. Create example message data structure in the component:
````typescript
   interface Message {
     id: string;
     role: 'user' | 'assistant';
     content: string;
     timestamp: Date;
     sources?: Array<{
       county: string;
       documentTitle: string;
       sectionHeader?: string;
     }>;
   }
````

5. Add some mock messages to demonstrate the UI (remove these later):
   - User: "What's the redemption period in Boulder County?"
   - Assistant: "In Boulder County, the redemption period is 3 years from the date of 
     the tax sale. This means property owners have 36 months to redeem their property 
     by paying the tax lien amount plus accrued interest."
     Sources: [Boulder County - Redemption Guidelines 2024 - Redemption Period]
   
   - User: "How much interest do tax liens earn?"
   - Assistant: "Tax liens in Boulder County earn 9% interest per annum for the first 
     year, and 12% per annum for subsequent years. Interest compounds monthly."
     Sources: [Boulder County - Redemption Guidelines 2024 - Interest Rates]

6. Style everything with Tailwind CSS v4:
   - Modern chat bubble design with rounded corners
   - Subtle shadows for depth
   - Proper spacing between messages
   - Responsive layout
   - Smooth scrolling behavior
   - Use Tailwind v4's improved utility classes

7. For now, when user sends a message, just add it to the messages array with a mock 
   AI response after 1 second delay (to simulate API call). We'll connect the real API later.

Add helpful empty state:
- When no messages: "Start by asking a question about tax lien redemption in Colorado"
- Example questions as clickable chips
```

### PART 4A: Document Processing for Markdown

```markdown
Create the document upload and processing API for Markdown files:

IMPORTANT: Import RAG_CONFIG from /lib/constants.ts for chunking settings.

1. Create /app/api/upload/route.ts as a POST handler that:
   - Accepts multipart/form-data with:
     * MD file (file field)
     * county (string)
     * documentTitle (string)
     * year (number)
   - Validates:
     * File is .md or .markdown extension
     * File size under 5MB
     * All metadata fields present
   - Reads file content as UTF-8 text
   - Processes the document (call processing function)
   - Returns JSON response:
     * Success: { success: true, documentId, chunkCount, sections }
     * Error: { success: false, error: message }
   - Proper HTTP status codes (200, 400, 500)

2. Create /lib/md-processor.ts with comprehensive markdown processing:

   CRITICAL: Import RAG_CONFIG for chunking settings at the top.

   Function: parseMarkdownStructure(content: string)
   - Extract all headers (H1, H2, H3) with their positions
   - Return array of sections with:
     * level (1, 2, or 3)
     * title (header text)
     * startPosition (character index)
     * endPosition (next header or EOF)
     * content (text under this header)

   Function: chunkMarkdownDocument(content: string, metadata: DocumentMetadata)
   - Import and use RAG_CONFIG.CHUNK_SIZE and RAG_CONFIG.CHUNK_OVERLAP
   - Intelligent chunking strategy:
     * Prefer chunking at H2 boundaries (##)
     * If H2 section > RAG_CONFIG.CHUNK_SIZE, split at H3 boundaries (###)
     * If still too large, split on paragraph breaks
     * Target chunk size: RAG_CONFIG.CHUNK_SIZE characters (default 1000)
     * Chunk overlap: RAG_CONFIG.CHUNK_OVERLAP characters (default 200)
       - When splitting, include last 200 chars of previous chunk at start of next
       - This prevents loss of context at chunk boundaries
       - Example: "...end of chunk 1" → "end of chunk 1 start of chunk 2..."
     * Never split mid-sentence
     * Minimum chunk size: 200 characters
   
   - Each chunk includes:
     * content: the actual text (with overlap from previous chunk if applicable)
     * metadata: county, documentTitle, year, chunkIndex, totalChunks
     * sectionHeader: the H2 header this chunk belongs to
     * subsectionHeader: the H3 header if applicable
   
   - Section Context Prefix (IMPORTANT):
     * Add hierarchical context to the FIRST chunk of each new section
     * Format: `[Context: Parent Section > Subsection]\n\n` at start of content
     * Only on first chunk of section (avoids repetition in subsequent chunks)
     * Helps embeddings understand document structure and hierarchy
     * Example:
   First chunk: "[Context: Step C > Application Steps]\n\nTo apply for..."
   Second chunk: "The fee covers deed processing..." (no prefix)
     * Implementation:

       if (isFirstChunkOfSection) {
         const contextPrefix = sectionHeader && subsectionHeader
           ? `[Context: ${sectionHeader} > ${subsectionHeader}]\n\n`
           : sectionHeader
           ? `[Context: ${sectionHeader}]\n\n`
           : "";
         
         chunk.content = contextPrefix + chunk.content;
       }

   
   - Preserve context by including parent headers in chunk metadata
     Example: If chunk is from "Required Documents > In-Person Redemption"
     Store: sectionHeader="Required Documents", subsectionHeader="In-Person Redemption"
   
   - Overlap implementation:

     // Pseudo-code for overlap
     let previousChunkEnd = "";
     
     for (let chunk of chunks) {
       if (previousChunkEnd) {
         // Add overlap from previous chunk
         chunk.content = previousChunkEnd + chunk.content;
       }
       // Store last N characters for next chunk
       previousChunkEnd = chunk.content.slice(-RAG_CONFIG.CHUNK_OVERLAP);
     }

   Function: processMarkdownDocument(fileContent: string, metadata: DocumentMetadata)
   - Main orchestration function:
     1. Parse markdown structure
     2. Chunk the document intelligently
     3. Add metadata to each chunk
     4. Return array of DocumentChunk objects
   - Handle edge cases:
     * Documents without headers (chunk by paragraphs)
     * Very short documents (single chunk)
     * Empty sections (skip)

3. Create /lib/types.ts with TypeScript interfaces:

   interface DocumentMetadata {
     county: string;
     documentTitle: string;
     year: number;
   }
   
   interface DocumentChunk {
     id: string; // generated unique ID
     content: string;
     metadata: DocumentMetadata & {
       chunkIndex: number;
       totalChunks: number;
       sectionHeader?: string;
       subsectionHeader?: string;
     };
   }
   
   interface MarkdownSection {
     level: number;
     title: string;
     content: string;
     startPosition: number;
     endPosition: number;
   }

4. In the /app/api/upload/route.ts:
   - Read the uploaded MD file as text
   - Call processMarkdownDocument with content and metadata
   - Log the chunks to console (with section headers visible)
   - For now, just return success with chunk information
   - Don't store in PostgreSQL yet (next step)

5. Add comprehensive error handling:
   - Try/catch blocks around file reading
   - Validate markdown isn't empty
   - Handle malformed content gracefully
   - Return descriptive error messages:
     * "File is too large (max 5MB)"
     * "Invalid file format (must be .md or .markdown)"
     * "Failed to process document: [specific error]"

6. Add logging for debugging:
   - Log uploaded filename and size
   - Log number of sections detected
   - Log number of chunks created
   - Log any warnings (e.g., "Very large section split into multiple chunks")

```

### PART 4B: PostgreSQL + pgvector Integration

```markdown
Setup PostgreSQL with pgvector extension for vector storage:

IMPORTANT CONFIGURATION STANDARDS:
- Distance threshold: 1.2 (consistent across all files, allows more results)
- Distance operator: <=> (cosine distance) ONLY - never use <-> or <#>
- Embedding dimensions: 1536 (using text-embedding-3-small with full dimensions)
- Index type: ivfflat with vector_cosine_ops
- Chunk overlap: 200 characters (prevents context loss at boundaries)
- Section context prefix: Add hierarchical context on first chunk of each section

1. Create /lib/constants.ts with RAG configuration:
````typescript
   export const RAG_CONFIG = {
     // Retrieval settings
     DEFAULT_TOP_K: 5,
     MAX_DISTANCE_THRESHOLD: 1.2,  // Cosine distance (0 = identical, 2 = opposite)
     
     // Embedding settings
     EMBEDDING_MODEL: 'text-embedding-3-small',
     EMBEDDING_DIMENSIONS: 1536,  // Full dimensions for best quality
     
     // Chunking settings
     CHUNK_SIZE: 1000,              // Target characters per chunk
     CHUNK_OVERLAP: 200,            // Character overlap between chunks
     
     // Distance operator (NEVER CHANGE THIS)
     DISTANCE_OPERATOR: '<=>' as const,  // Cosine distance operator
   } as const;
````
   This file ensures consistency across all retrieval code.

2. Create /lib/db/postgres-client.ts with:
   - Initialize PostgreSQL client using DATABASE_URL from env
   - Connection pool setup for production use
   - Function: getClient()
     * Return connection pool instance
     * Handle connection errors
   - Function: initDatabase()
     * Create pgvector extension if not exists: CREATE EXTENSION IF NOT EXISTS vector
     * Create document_chunks table:
````sql
       CREATE TABLE IF NOT EXISTS document_chunks (
         id TEXT PRIMARY KEY,
         document_id TEXT NOT NULL,
         content TEXT NOT NULL,
         embedding vector(1536), -- MUST be 1536 to match embedding dimensions
         county TEXT NOT NULL,
         document_title TEXT NOT NULL,
         year INTEGER NOT NULL,
         chunk_index INTEGER NOT NULL,
         total_chunks INTEGER NOT NULL,
         section_header TEXT,
         subsection_header TEXT,
         created_at TIMESTAMP DEFAULT NOW()
       );
       
       -- CRITICAL: Create index with vector_cosine_ops (for <=> operator)
       CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
       ON document_chunks USING ivfflat (embedding vector_cosine_ops)
       WITH (lists = 100);
       
       -- Create index for filtering by county
       CREATE INDEX IF NOT EXISTS document_chunks_county_idx 
       ON document_chunks(county);
       
       -- Create index for document_id lookups
       CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx 
       ON document_chunks(document_id);
````
   - Export initialized pool and helper functions
   - Add comprehensive error handling

3. Create /lib/embeddings.ts with OpenAI embedding functions:
   - Import RAG_CONFIG from constants.ts
   - Function: generateEmbedding(text: string)
     * Use OpenAI API with RAG_CONFIG.EMBEDDING_MODEL
     * MUST set dimensions: RAG_CONFIG.EMBEDDING_DIMENSIONS (1536)
     * Take a single text string
     * Return embedding vector (1536 dimensions)
     * Handle API errors gracefully
   
   - Function: generateEmbeddings(texts: string[])
     * Batch version for multiple texts
     * Process in batches of 100 (OpenAI limit)
     * MUST set dimensions: RAG_CONFIG.EMBEDDING_DIMENSIONS (1536)
     * Return array of embedding vectors
     * Show progress for large batches (>50 texts)
   
   - Add rate limiting awareness:
     * Implement basic retry logic (3 attempts)
     * Exponential backoff on rate limit errors
     * Log warnings for rate limit hits
   
   - Error handling:
     * Invalid API key (clear message)
     * Network errors (retry)
     * Empty text input (return error)

4. Create /lib/db/vector-store.ts with PostgreSQL operations:

   Function: storeDocumentChunks(chunks: DocumentChunk[])
   - Get PostgreSQL client from pool
   - Generate embeddings for all chunk contents using OpenAI
   - Insert chunks into document_chunks table:
````typescript
     const query = `
       INSERT INTO document_chunks 
       (id, document_id, content, embedding, county, document_title, year, 
        chunk_index, total_chunks, section_header, subsection_header)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     `;
     
     for (const chunk of chunks) {
       await client.query(query, [
         chunk.id,
         chunk.documentId,
         chunk.content,
         `[${embedding.join(',')}]`, // pgvector format
         chunk.metadata.county,
         chunk.metadata.documentTitle,
         chunk.metadata.year,
         chunk.metadata.chunkIndex,
         chunk.metadata.totalChunks,
         chunk.metadata.sectionHeader || null,
         chunk.metadata.subsectionHeader || null
       ]);
     }
````
   - Use transactions for atomicity
   - Return: { success: boolean, vectorCount: number }
   - Log progress for large uploads
   - Handle errors gracefully

   Function: deleteDocumentVectors(documentId: string)
   - Delete all rows with matching document_id
   - Use prepared statement to prevent SQL injection
   - Return success status
   
   Function: queryVectors(queryText: string, options: QueryOptions)
   - Import RAG_CONFIG from constants.ts
   - Generate embedding for query text using OpenAI
   - CRITICAL: Query PostgreSQL with COSINE DISTANCE operator (<=>):
````typescript
     const query = `
       SELECT 
         id, content, county, document_title, section_header, subsection_header,
         embedding <=> $1::vector AS distance
       FROM document_chunks
       ${options.county ? 'WHERE county = $2' : ''}
       ORDER BY embedding <=> $1::vector
       LIMIT $${options.county ? 3 : 2}
     `;
     // NEVER use <-> (L2 distance) or <#> (inner product)
     // ALWAYS use <=> (cosine distance) to match the index
````
   - Options:
     * topK: number of results (default from RAG_CONFIG.DEFAULT_TOP_K)
     * maxDistance: filter threshold (default from RAG_CONFIG.MAX_DISTANCE_THRESHOLD)
     * county: filter by specific county
   - Return array of matches with:
     * content: the document text
     * metadata: county, title, section, etc.
     * distance: cosine distance (lower = more similar, range 0-2)
   - Filter results by maxDistance threshold
   - Handle no results gracefully

   Function: getDocumentStats()
   - Query total document count
   - Query count by county
   - Return statistics for debugging/monitoring

5. Update /app/api/upload/route.ts to use PostgreSQL:
   - After processing document into chunks
   - Call initDatabase() to ensure table exists
   - Call generateEmbeddings for all chunk contents
   - Call storeDocumentChunks to save to PostgreSQL
   - Update response to include:
     * success: true
     * documentId: generated ID
     * chunkCount: number of chunks
     * vectorCount: number of vectors stored
     * sections: array of section titles detected
   - Handle vector storage errors:
     * If embedding fails: return 500 with error
     * If PostgreSQL fails: return 503 with error
     * Provide clear error messages for debugging

6. Add comprehensive logging:
   - Log: "Connecting to PostgreSQL..."
   - Log: "Initializing pgvector extension..."
   - Log: "Generating embeddings for X chunks..."
   - Log: "Using model: text-embedding-3-small with 1536 dimensions"
   - Log: "Storing vectors in PostgreSQL..."
   - Log: "Successfully stored X vectors"
   - Log database stats after operations
   - Log any warnings or errors with context

7. Create a test utility /lib/db/postgres-test.ts:
   - Function to verify PostgreSQL connection
   - Function to check if pgvector extension is installed
   - Function to verify index exists and uses vector_cosine_ops
   - Function to get table stats
   - Function to test vector search with sample embedding
   - Log current row count
   - Export for debugging purposes

CRITICAL REMINDERS:
1. ALWAYS use <=> operator (cosine distance) in ALL queries
2. Index MUST use vector_cosine_ops (not vector_l2_ops)
3. Embedding dimensions MUST be 1536 everywhere
4. Distance threshold MUST be 1.2 everywhere (use RAG_CONFIG)
5. NEVER mix distance operators or thresholds
6. Import RAG_CONFIG in all files that do retrieval or embeddings
7. Add section context prefix on FIRST chunk of each section only

Key PostgreSQL + pgvector concepts:
- vector(1536) is a pgvector data type for 1536-dimensional embeddings
- <=> operator calculates cosine distance (0 = identical, 2 = opposite)
- Lower distance = more similar = better match
- Distance threshold of 1.2 allows more diverse results while filtering noise
- ivfflat index with vector_cosine_ops speeds up cosine distance searches
- Standard SQL for all operations (very familiar!)
```

### PART 4C: Query and Answer Pipeline

```markdown
Create the chat/query API endpoint with RAG pipeline:

1. Create /app/api/chat/route.ts as a POST handler that:
   - Accepts JSON body:

     {
       message: string,
       county?: string, // optional filter
       conversationHistory?: Message[] // for context
     }

   - Validates message is not empty
   - Returns streaming response for better UX
   - Proper error handling and status codes

2. Create /lib/retrieval.ts with semantic search functions:

   Function: retrieveRelevantChunks(query: string, options?: RetrievalOptions)
   - Generate embedding for user query using OpenAI
   - Query PostgreSQL with vector similarity search
   - Options interface:

     {
       topK?: number; // default 5
       county?: string; // filter by specific county
       minDistance?: number; // maximum distance threshold (default 0.5)
     }

   - PostgreSQL query with pgvector:

     SELECT 
       id, content, county, document_title, section_header, subsection_header,
       embedding <=> $1::vector AS distance
     FROM document_chunks
     ${county ? 'WHERE county = $2' : ''}
     ORDER BY embedding <=> $1::vector
     LIMIT ${topK}

   - Return array of relevant chunks with:
     * content (the actual text)
     * metadata (county, document, section)
     * distance (similarity distance, lower = more similar)
   - Filter out chunks above maximum distance
   - Handle edge cases:
     * No results found (return empty array)
     * All results above threshold (return empty array)
     * PostgreSQL errors (throw with clear message)

   Function: formatContextForLLM(chunks: DocumentChunk[])
   - Format retrieved chunks into a context string for the LLM
   - Structure:
 Context from Colorado Tax Lien Documents:

 [Boulder County - Redemption Guidelines 2024 - Redemption Period]
 In Boulder County, the redemption period is 3 years from the date of tax sale...

 [Denver County - Tax Lien Procedures - Interest Rates]
 Tax liens in Denver County earn interest at...
   - Include source attribution for each chunk
   - Keep context concise (combine similar chunks if needed)
   - Return formatted string

3. Create /lib/answer-generation.ts with LLM response generation:

   Function: generateAnswer(query: string, context: string, stream: boolean)
   
   - Create system prompt:
 You are a helpful assistant specializing in Colorado tax lien redemption processes.
 
 Your role:
 - Answer questions accurately based on the provided context from county documents
 - Always cite which county and document your information comes from
 - If the context doesn't contain the answer, clearly state that
 - Use a professional but friendly tone
 - Be specific and precise with numbers, dates, and procedures
 - Never make up information not in the context
 
 Format your answers with:
 1. Direct answer to the question
 2. Supporting details from the context
 3. Source citations in brackets [County Name - Document]
 
 If comparing multiple counties, structure the comparison clearly.
   
   - Create user prompt:
 Context from uploaded documents:
 {formatted_context}
 
 User Question: {query}
 
 Instructions:
 - Answer based ONLY on the provided context
 - Cite sources after each fact: [County - Document - Section]
 - If information is not in the context, say: "I don't have information about 
   that in the uploaded documents. You may need to upload guidelines from [relevant county]."
 - Be concise but complete
   
   - Call OpenAI Chat Completion API:
     * Model: gpt-4o-mini (cost-effective and fast)
     * Temperature: 0.1 (factual, consistent)
     * Max tokens: 800
     * Stream: true (for real-time response)
   
   - If streaming:
     * Return ReadableStream that yields chunks as they arrive
     * Handle stream errors gracefully
   
   - If not streaming:
     * Return complete response
   
   - Extract and return sources mentioned in the response

4. Wire everything together in /app/api/chat/route.ts:

   POST handler flow:
   1. Validate request body (message exists, is string, not empty)
   2. Extract query and optional county filter
   3. Call retrieveRelevantChunks(query, { county, topK: 5 })
   4. Check if chunks found:
      - If empty: return helpful message suggesting to upload documents
      - If found: continue
   5. Format context using formatContextForLLM(chunks)
   6. Generate answer using generateAnswer(query, context, stream: true)
   7. Stream response back to client
   8. Include metadata in final message:
      - sources: array of unique {county, documentTitle, section}
      - chunksUsed: number of chunks retrieved
   
   Response format for streaming:

   // Streamed tokens as they arrive
   data: { type: 'token', content: 'In Boulder County...' }
   data: { type: 'token', content: ' the redemption' }
   ...
   // Final message with sources
   data: { 
     type: 'complete',
     sources: [
       { county: 'Boulder', documentTitle: 'Redemption Guidelines 2024', section: 'Redemption Period' }
     ]
   }


5. Error handling throughout:
   - Empty query: 400 "Message is required"
   - Retrieval fails: 500 "Failed to search documents"
   - No relevant chunks: 200 with helpful message
   - LLM fails: 500 "Failed to generate response"
   - Always return JSON with error details

6. Add logging for monitoring:
   - Log: "Query: [user question]"
   - Log: "Retrieved X chunks (scores: Y-Z)"
   - Log: "Generated response (N tokens)"
   - Log any errors with full context

```

### PART 4D: Connect Frontend to Backend

```markdown
Update the chat and upload interfaces to call the real APIs:

1. Update /components/chat-interface.tsx to call /api/chat:
   
   - Remove mock messages
   - Add state for:
     * messages: Message[]
     * isLoading: boolean
     * error: string | null
     * countyFilter: string | null
   
   - Create async function: sendMessage(messageText: string)
     * Add user message to messages array immediately
     * Set isLoading to true
     * Call /api/chat endpoint with POST:

       {
         message: messageText,
         county: countyFilter
       }

     * Handle streaming response:
       - Read stream chunks as they arrive
       - Create assistant message that updates in real-time
       - Display "thinking..." before first chunk arrives
     * When complete, add sources to the assistant message
     * Set isLoading to false
     * Handle errors:
       - Network errors: "Failed to connect. Please try again."
       - API errors: Display error message from server
       - Timeout: "Request timed out. Please try again."
   
   - Update UI:
     * Disable input while isLoading
     * Show typing indicator (three dots) while AI responds
     * Auto-scroll to latest message as tokens stream in
     * Display error banner if error occurs (with retry button)
   
   - Add county filter dropdown above chat:
     * "All Counties" (default)
     * Each Colorado county as option
     * Update countyFilter state on change
     * Show active filter as badge

2. Update /components/document-upload.tsx to call /api/upload:
   
   - Create async function: handleUpload()
     * Validate file and metadata
     * Create FormData with file and metadata
     * Set uploading state (disable button, show progress)
     * Call /api/upload with POST (multipart/form-data)
     * Handle response:
       - Success: Show success toast with chunk count
       - Error: Show error toast with message
     * Reset form after successful upload
     * Refresh document list
   
   - Add progress tracking:
     * Show upload progress bar (0-100%)
     * Show processing status: "Uploading... Chunking... Embedding... Complete!"
     * Disable all inputs during upload
   
   - Error handling:
     * File too large: Clear message with size limit
     * Invalid format: Explain accepted formats
     * Network error: Suggest retry
     * Server error: Display specific error message

3. Update /components/document-list.tsx to fetch documents:
   
   - Add useEffect to fetch documents on mount
   - Create /app/api/documents/route.ts:
     * GET handler that returns list of uploaded documents
     * Query PostgreSQL for unique documents (group by document_id)
     * Return array with metadata and chunk counts
   
   - Display loading state while fetching
   - Display documents in cards
   - Add delete functionality:
     * Confirmation dialog before delete
     * Call DELETE /api/documents/[id]
     * Refresh list after successful delete

4. Create /lib/api-client.ts with helper functions:

   // Upload document
   async function uploadDocument(
     file: File,
     metadata: { county: string; title: string; year: number }
   ): Promise<UploadResponse>
   
   // Send chat message with streaming
   async function sendChatMessage(
     message: string,
     options?: { county?: string }
   ): Promise<ReadableStream>
   
   // Fetch documents
   async function fetchDocuments(): Promise<Document[]>
   
   // Delete document
   async function deleteDocument(id: string): Promise<void>

   
   - Proper TypeScript types for all responses
   - Error handling with typed errors
   - Retry logic for failed requests (up to 3 attempts)

5. Add loading states throughout:
   - Skeleton loaders for document list
   - Shimmer effect while AI is thinking
   - Smooth transitions between states
   - Clear visual feedback for all actions

6. Polish the UX:
   - Toast notifications for success/error (use sonner or shadcn toast)
   - Smooth animations using Framer Motion or CSS transitions
   - Keyboard shortcuts (Escape to cancel, etc.)
   - Focus management (focus input after sending message)
   - Accessible (ARIA labels, keyboard navigation)

Make the streaming response feel natural, like ChatGPT - words appear smoothly, not in 
jarring chunks.
```

### PART 5: Railway Deployment (Optional)

```markdown
Prepare this Next.js application for production deployment on Railway:

1. Create railway.json in project root:

   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm run build"
     },
     "deploy": {
       "startCommand": "npm run start",
       "healthcheckPath": "/api/health",
       "healthcheckTimeout": 100,
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }


2. Create /app/api/health/route.ts:
   - Simple health check endpoint
   - GET handler that returns:

     {
       "status": "ok",
       "timestamp": "2024-01-15T10:30:00Z",
       "version": "1.0.0",
       "services": {
         "postgresql": "connected",
         "pgvector": "enabled",
         "openai": "connected"
       }
     }

   - Check connections to PostgreSQL (with pgvector) and OpenAI
   - Query PostgreSQL: `SELECT 1` to verify connection
   - Check pgvector: `SELECT * FROM pg_extension WHERE extname = 'vector'`
   - Return 200 if healthy, 503 if any service down
   - Railway uses this for health monitoring

3. Update package.json:
   - Ensure scripts are correct:

     {
       "scripts": {
         "dev": "next dev",
         "build": "next build",
         "start": "next start",
         "lint": "next lint"
       }
     }

   - Verify all dependencies are in "dependencies" not "devDependencies"
   - Add engines field:

     {
       "engines": {
         "node": ">=18.0.0",
         "npm": ">=9.0.0"
       }
     }


4. Update .env.example with ALL required variables:
OpenAI API Key (get from platform.openai.com)
OPENAI_API_KEY=sk-your_key_here
PostgreSQL Database URL (from Railway PostgreSQL service)
DATABASE_URL=postgresql://user:password@host:port/database
Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

5. Create DEPLOYMENT.md with comprehensive instructions:
   # Deployment Guide
   
   ## Prerequisites
   1. Railway account (railway.app)
   2. OpenAI API key (platform.openai.com)
   3. PostgreSQL client tools (optional but recommended):
      - `brew install postgresql` (for psql command)
      - `brew install --cask postico` (for Mac GUI database viewer)
      - Alternative: TablePlus, pgAdmin, or use Railway's web interface
   
   ## Important: Using pgvector on Railway
   
   **CRITICAL:** You must use Railway's pgvector template, not the default PostgreSQL!
   
   Railway's default PostgreSQL does NOT include pgvector. You must:
   1. Deploy from the "PostgreSQL with pgvector" template
   2. Manually enable the vector extension after deployment
   
   ## Step 1: Prepare Application
   Ensure your Next.js 15 app is ready:
   - All dependencies in package.json
   - DATABASE_URL environment variable configured
   - PostgreSQL queries use correct pgvector syntax
   
   ## Step 2: Create PostgreSQL with pgvector on Railway
   1. Log into Railway
   2. Create new project or use existing
   3. Click "Deploy from Template" (NOT "Add PostgreSQL")
   4. Search for "pgvector"
   5. Select "PostgreSQL with pgvector" template
   6. Click "Deploy Now"
   7. Wait for PostgreSQL to provision (~30 seconds)
   8. Copy the DATABASE_URL from the database service
   
   ## Step 3: Enable pgvector Extension
   
   **Option A: Using psql (Terminal)**

   # Connect to your Railway PostgreSQL
   psql "your_database_url_here"
   
   # Enable pgvector
   CREATE EXTENSION IF NOT EXISTS vector;
   
   # Verify it worked
   \dx vector
   
   # Should show: vector | 0.5.1 | ... | vector data type
   
   # Exit
   \q

   
   **Option B: Using Railway Query Interface**
   1. Go to Railway PostgreSQL service
   2. Click "Query" tab
   3. Run: `CREATE EXTENSION IF NOT EXISTS vector;`
   4. Verify: `SELECT extname FROM pg_extension WHERE extname = 'vector';`
   
   **Note:** This is a one-time setup. Your application's `initDatabase()` function 
   will create the tables, but the extension must be enabled first.
   
   ## Step 4: Connect Database GUI (Optional but Recommended)
   
   ### Using Postico (Mac)
   1. Install: `brew install --cask postico`
   2. Open Postico
   3. Click "New Favorite"
   4. Enter connection details from DATABASE_URL:
      - Host: (from DATABASE_URL)
      - Port: (usually 5432)
      - User: (from DATABASE_URL)
      - Password: (from DATABASE_URL)
      - Database: (from DATABASE_URL)
   5. Enable "Use SSL" (required by Railway)
   6. Click "Connect"
   
   ### Using TablePlus (Mac/Windows)
   1. Download from tableplus.com
   2. Create new PostgreSQL connection
   3. Paste DATABASE_URL or enter details manually
   4. Enable SSL
   5. Connect
   
   ## Step 5: Deploy Next.js Application
   1. Fork/clone this repository
   2. Go to railway.app
   3. Click "New Project" → "Deploy from GitHub repo"
   4. Select this repository
   5. Railway will auto-detect Next.js and start building
   
   ## Step 6: Configure Environment Variables
   In your Next.js app service on Railway, add these variables:
   - OPENAI_API_KEY
   - DATABASE_URL (copy from PostgreSQL service, or use Railway's variable reference)
   - NODE_ENV=production
   
   Pro tip: Use Railway's variable references to connect services:
   - DATABASE_URL=${{Postgres.DATABASE_URL}}
   
   ## Step 7: Verify Deployment
   1. Wait for deployment to complete
   2. Visit the generated URL
   3. Check /api/health endpoint
   4. Upload a test document
   5. Ask a test question
   
   ## Cost Estimates (Monthly)
   - Railway App Service: $5-10 (depending on usage)
   - Railway PostgreSQL: $5-10 (shared CPU, 1GB RAM)
   - OpenAI: ~$0.10 per 1000 queries (varies by usage)
   
   Total: ~$10-25/month
   
   Note: Railway PostgreSQL includes pgvector extension at no extra cost!
   
   ## Troubleshooting
   
   **Build fails:**
   - Check Node version (18+)
   - Verify all dependencies in package.json (pg, pgvector)
   - Check Railway build logs
   
   **Runtime errors:**
   - Verify all environment variables set
   - Check DATABASE_URL is correct and accessible
   - Verify PostgreSQL service is running on Railway
   - Check pgvector extension is installed: `SELECT * FROM pg_extension WHERE extname = 'vector';`
   - Verify OpenAI API key is valid
   
   **Upload fails:**
   - Check PostgreSQL connection
   - Verify table was created (check initDatabase logs)
   - Check disk space on PostgreSQL service
   - Verify embeddings are being generated successfully
   
   **Slow responses:**
   - Consider upgrading Railway plan
   - Monitor OpenAI rate limits
   - Check PostgreSQL query performance
   - Verify ivfflat index is created and being used
   
   **Vector search returns no results:**
   - Verify documents were uploaded successfully
   - Query PostgreSQL directly: `SELECT COUNT(*) FROM document_chunks;`
   - Check embedding dimensions match (1536)
   - Try increasing distance threshold
   - Check query syntax with pgvector operators
   
   **Can't see data in database:**
   - Use Railway's "Data" tab in PostgreSQL service
   - Or connect with TablePlus/pgAdmin using DATABASE_URL
   - Verify table exists: `\dt` in psql


6. Add production optimizations:
   
   - Create /lib/env.ts for environment validation:

     // Validate all required env vars on startup
     // Throw clear errors if missing
     // Type-safe access to env vars
   
   - Update API routes to check environment on cold start:
     * Log startup with timestamp
     * Verify connections to external services
     * Cache connections where possible
   
   - Add request logging middleware:
     * Log all API requests with timestamp
     * Log response times
     * Log errors with full context
     * Don't log sensitive data (API keys, personal info)
   
   - Add rate limiting considerations:
     * Document in DEPLOYMENT.md
     * Suggest implementing rate limiting for production
     * Provide example using upstash-ratelimit

7. Create README.md for GitHub:
   
   - Project description
   - Features list
   - Tech stack
   - Quick start guide
   - Link to DEPLOYMENT.md
   - Screenshots/demo GIF
   - License (MIT)

8. Optional: Create Dockerfile for alternative deployment:

   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]


Make sure everything is production-ready with proper error handling, logging, and documentation.

```