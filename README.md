# Tax Lien RAG Assistant

An intelligent research assistant powered by RAG (Retrieval Augmented Generation) to help you find and understand tax lien information quickly and accurately.

## Features

- **Document Upload & Processing**: Upload tax lien documents and process them into a searchable knowledge base
- **Vector Search**: Uses pgvector for efficient similarity search across document embeddings
- **AI-Powered Chat**: Get accurate answers based on your documents using GPT-4
- **PostgreSQL Backend**: Reliable data storage with vector similarity capabilities

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v3 (stable), shadcn/ui
- **Database**: PostgreSQL with pgvector extension
- **AI/ML**: OpenAI API, LangChain
- **RAG**: Custom implementation using LangChain and pgvector

> **Note**: We're using Tailwind CSS v3 instead of v4 because v4 is still in beta and has compatibility issues with Next.js 15.5.6. See [TAILWIND_STATUS.md](TAILWIND_STATUS.md) for details.

## Prerequisites

Before running this application, you need:

1. **Node.js** 18+ installed
2. **PostgreSQL** with **pgvector extension** installed
   - You can use a managed PostgreSQL service like:
     - [Neon](https://neon.tech) (includes pgvector)
     - [Supabase](https://supabase.com) (includes pgvector)
     - [Railway](https://railway.app) (requires manual pgvector installation)
   - Or install locally with pgvector extension
3. **OpenAI API Key** for embeddings and chat completion

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database with pgvector extension enabled. Then run the schema:

```bash
# Connect to your database and run:
psql -d your_database_url -f lib/db/schema.sql
```

Or manually execute the SQL in `lib/db/schema.sql` in your PostgreSQL client.

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://user:password@host:port/database
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
tax-lien-rag/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── upload/            # Document upload page
│   └── chat/              # Chat interface page
├── components/            # React components
│   └── Navigation.tsx     # Navigation header
├── lib/                   # Utilities and core logic
│   ├── db/               # Database related code
│   │   ├── client.ts     # PostgreSQL connection pool
│   │   └── schema.sql    # Database schema with pgvector
│   └── utils.ts          # Utility functions
├── .env.example          # Environment variables template
└── README.md            # This file
```

## Database Schema

The application uses a `document_chunks` table with the following structure:

- `id`: Primary key
- `document_name`: Name of the source document
- `chunk_text`: Text content of the chunk
- `chunk_index`: Position in the original document
- `embedding`: Vector embedding (1536 dimensions for OpenAI ada-002)
- `metadata`: Additional JSON metadata
- `created_at`: Timestamp
- `updated_at`: Timestamp

Vector similarity search is performed using pgvector's cosine distance operator.

## PostgreSQL + pgvector Setup

### Option 1: Managed Services (Recommended)

**Neon** (Easiest):
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. pgvector is pre-installed - just run the schema
4. Copy the connection string to `.env`

**Supabase**:
1. Create a project at [supabase.com](https://supabase.com)
2. pgvector is pre-installed
3. Run the schema in SQL Editor
4. Use the connection string from Settings > Database

### Option 2: Railway

1. Create a PostgreSQL database on [railway.app](https://railway.app)
2. Connect to the database
3. Install pgvector extension manually
4. Run the schema

### Option 3: Local Installation

```bash
# macOS with Homebrew
brew install postgresql pgvector

# Start PostgreSQL
brew services start postgresql

# Create database
createdb tax_lien_rag

# Enable pgvector
psql tax_lien_rag -c "CREATE EXTENSION vector;"

# Run schema
psql tax_lien_rag -f lib/db/schema.sql
```

## Next Steps

1. Implement document upload functionality
2. Add document chunking and embedding generation
3. Build the chat interface
4. Add vector similarity search
5. Implement RAG pipeline with LangChain

## License

MIT
