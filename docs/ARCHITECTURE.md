# Architecture Documentation

## System Overview

The Tax Lien RAG Assistant is a Next.js application that uses Retrieval-Augmented Generation (RAG) to provide intelligent search and question-answering capabilities over Colorado tax lien documents.

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v3, shadcn/ui components
- **Database**: PostgreSQL with pgvector extension (Neon)
- **AI/ML**: OpenAI API (embeddings + GPT-4o-mini)
- **RAG Pipeline**: Custom implementation using LangChain patterns

## Project Structure

```
tax-lien-rag/
├── app/                        # Next.js App Router
│   ├── api/                   # API routes
│   │   ├── chat/             # Chat endpoint
│   │   ├── documents/        # Document management
│   │   ├── init-db/          # Database initialization
│   │   └── upload/           # Document upload
│   ├── chat/                 # Chat interface page
│   ├── upload/               # Upload interface page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── document-upload.tsx   # Upload form component
│   └── document-list.tsx     # Document management
├── lib/                      # Core utilities
│   ├── db/                   # Database utilities
│   │   ├── client.ts        # PostgreSQL connection
│   │   └── schema.sql       # Database schema
│   ├── answer-generation.ts  # LLM response generation
│   ├── retrieval.ts          # Semantic search
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utility functions
├── docs/                     # Documentation
├── sample-documents/         # Sample markdown files
└── ...config files
```

## Component Architecture

### Page Components

**Home Page** ([app/page.tsx](app/page.tsx))
- Landing page with feature overview
- Navigation to Upload and Chat pages

**Upload Page** ([app/upload/page.tsx](app/upload/page.tsx))
- Toggle between upload form and document list
- Manages upload/view state

**Chat Page** ([app/chat/page.tsx](app/chat/page.tsx))
- Chat interface for asking questions
- Streaming responses from RAG pipeline

### Reusable Components

**DocumentUpload** ([components/document-upload.tsx](components/document-upload.tsx))
- Drag-and-drop file upload
- Metadata form (county, title, year)
- Preview section with headers and content
- State: selectedFile, metadata, preview, isUploading, error

**DocumentList** ([components/document-list.tsx](components/document-list.tsx))
- Grid layout of uploaded documents
- County filter dropdown
- Delete confirmation dialog
- State: documents, selectedCounty, deleteDialog, isLoading

### UI Components (shadcn/ui)

Located in [components/ui/](components/ui/):
- Button, Card, Input, Label, Select
- Badge, Dialog, Alert, Toast
- All styled with Tailwind CSS

## Data Flow

### Upload Flow

```
User selects file
    ↓
File validation (extension, size)
    ↓
FileReader generates preview
    ↓
User fills metadata form
    ↓
POST /api/upload
    ↓
Process markdown (chunking)
    ↓
Generate embeddings (OpenAI)
    ↓
Store in PostgreSQL with pgvector
    ↓
Return success response
```

### Query Flow

```
User enters question
    ↓
Generate query embedding
    ↓
Vector similarity search (pgvector)
    ↓
Retrieve top K chunks
    ↓
Format context for LLM
    ↓
Generate answer (GPT-4o-mini)
    ↓
Stream response to user
    ↓
Display with source citations
```

## State Management

### Upload Page
- `showUpload` - Toggle between upload/list view

### DocumentUpload
- `selectedFile` - Currently selected file
- `isDragging` - Drag-over visual feedback
- `metadata` - { county, title, year }
- `preview` - { content, headers, size }
- `isUploading` - Upload in progress
- `error` - Error messages

### DocumentList
- `documents` - Array of uploaded documents
- `selectedCounty` - Filter state
- `deleteDialog` - { open, documentId }
- `isLoading` - Loading state

## Database Schema

**Table**: `document_chunks`

```sql
CREATE TABLE document_chunks (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  county VARCHAR(100) NOT NULL,
  document_title VARCHAR(500) NOT NULL,
  section_header TEXT,
  subsection_header TEXT,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX ON document_chunks(county);
CREATE INDEX ON document_chunks(document_title);
```

## API Endpoints

### POST /api/upload
- Upload markdown documents
- Process and chunk text
- Generate embeddings
- Store in database

### POST /api/chat
- Accept user queries
- Retrieve relevant chunks
- Generate AI responses
- Stream results with citations

### GET/POST/DELETE /api/documents
- List uploaded documents
- Get document details
- Delete documents

### POST /api/init-db
- Initialize database schema
- Create pgvector extension
- Set up indexes

## Responsive Design

### Breakpoints
- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: 1024px+ (3 columns)

### Layout Strategy
- Mobile-first approach
- Flexbox for headers/forms
- CSS Grid for document cards
- Stacked layouts on small screens

## Styling Approach

### Tailwind CSS v3
- Utility-first CSS framework
- Custom color scheme via CSS variables
- Dark mode support ready
- JIT compilation for optimal bundle size

### Color System
```css
--background: 0 0% 100%
--foreground: 0 0% 9%
--primary: 0 0% 9%
--muted: 0 0% 96%
--border: 0 0% 89%
```

### County Badge Colors
Each county has unique colors:
- Boulder → Blue
- Denver → Purple
- Arapahoe → Green
- Clear Creek → Cyan
- etc.

## Performance Considerations

### Frontend
- Next.js App Router for optimal routing
- React Server Components where possible
- Client components only when needed
- Optimized bundle splitting

### Database
- ivfflat index for fast vector search
- B-tree indexes on county/title
- Connection pooling via pg
- Prepared statements for queries

### AI/ML
- Streaming responses for better UX
- Small model (gpt-4o-mini) for cost efficiency
- Low temperature (0.1) for consistency
- Capped response length (800 tokens)

## Security

- Environment variables for sensitive data
- Input validation on all forms
- SQL injection prevention (parameterized queries)
- File upload validation (size, type)
- CORS headers on API routes

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus visible states
- Screen reader friendly
- WCAG AA color contrast

## Future Enhancements

1. **Authentication** - User accounts and permissions
2. **Conversation History** - Save and resume chats
3. **Advanced Search** - Hybrid search (vector + keyword)
4. **Batch Upload** - Multiple files at once
5. **Document Preview** - Full markdown rendering
6. **Export Features** - Download search results
7. **Analytics** - Usage tracking and insights
8. **Caching** - Query result caching
