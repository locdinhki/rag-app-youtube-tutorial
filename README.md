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
