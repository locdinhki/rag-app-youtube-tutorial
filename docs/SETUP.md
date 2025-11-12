# Setup Guide

## Prerequisites

Before running this application, you need:

1. **Node.js 18+** installed
2. **PostgreSQL with pgvector extension**
   - Recommended: [Neon](https://neon.tech) (includes pgvector)
   - Alternative: [Supabase](https://supabase.com) or local PostgreSQL
3. **OpenAI API Key** for embeddings and chat completion

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd YT-rag-tutorial
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Neon (Recommended - Easiest)

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. pgvector is pre-installed
4. Copy connection string from dashboard
5. Run schema:

```bash
# Set DATABASE_URL in .env first
psql $DATABASE_URL -f lib/db/schema.sql
```

#### Option B: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. pgvector is pre-installed
3. Run schema in SQL Editor (paste contents of `lib/db/schema.sql`)
4. Copy connection string from Settings > Database

#### Option C: Local PostgreSQL

**macOS (Homebrew)**:
```bash
brew install postgresql pgvector
brew services start postgresql
createdb tax_lien_rag
psql tax_lien_rag -c "CREATE EXTENSION vector;"
psql tax_lien_rag -f lib/db/schema.sql
```

**Ubuntu/Debian**:
```bash
sudo apt install postgresql postgresql-contrib
# Install pgvector from source or package manager
sudo -u postgres createdb tax_lien_rag
sudo -u postgres psql tax_lien_rag -c "CREATE EXTENSION vector;"
psql tax_lien_rag -f lib/db/schema.sql
```

### 4. Environment Variables

Copy example env file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
DATABASE_URL=postgresql://user:password@host:port/database
```

**Get OpenAI API Key**:
1. Visit [platform.openai.com](https://platform.openai.com)
2. Create account or sign in
3. Go to API Keys section
4. Create new secret key
5. Copy and paste into `.env`

### 5. Initialize Database

Run database initialization (creates tables and indexes):

```bash
# Option 1: Via API endpoint
npm run dev
curl -X POST http://localhost:3000/api/init-db

# Option 2: Directly with psql
psql $DATABASE_URL -f lib/db/schema.sql
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verify Installation

### 1. Check Database Connection

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Verify pgvector extension
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Check tables exist
psql $DATABASE_URL -c "\dt"
```

Expected output should include `document_chunks` table.

### 2. Test Upload

1. Navigate to `/upload`
2. Upload sample file: `sample-documents/boulder-redemption-2025.md`
3. Fill metadata:
   - County: Boulder
   - Title: Redemption Guidelines 2025
   - Year: 2025
4. Click "Upload Document"
5. Check for success message

### 3. Test Chat

1. Navigate to `/chat`
2. Enter question: "What is the redemption period in Boulder County?"
3. Should receive streamed response with citations
4. Sources should be displayed below answer

## Troubleshooting

### Issue: Database connection fails

**Solution**:
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Should look like:
# postgresql://username:password@host:port/database
# or for Neon:
# postgresql://username:password@ep-xxx.region.aws.neon.tech/database?sslmode=require

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: pgvector extension not found

**Solution**:
```bash
# Install pgvector extension
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Verify installation
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### Issue: OpenAI API errors

**Solution**:
1. Verify API key is correct in `.env`
2. Check API key has credits at [platform.openai.com](https://platform.openai.com)
3. Ensure no extra spaces or quotes in `.env` file
4. Restart dev server after changing `.env`

### Issue: Build fails

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

### Issue: Styles not applying

**Solution**:
```bash
# Verify Tailwind is installed
npm list tailwindcss

# Check postcss.config.mjs exists
cat postcss.config.mjs

# Clear cache and rebuild
rm -rf .next
npm run dev
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings and LLM | `sk-...` |
| `DATABASE_URL` | Yes | PostgreSQL connection string with pgvector | `postgresql://...` |
| `NODE_ENV` | No | Environment (development/production) | `development` |

## Sample Documents

Test documents are provided in `sample-documents/`:
- `boulder-redemption-2025.md` - Boulder County redemption guidelines
- `Clear_Creek_County_Tax_Lien_2025_FIXED.md` - Clear Creek County tax lien info

Use these for testing the upload and chat features.

## Next Steps

After successful installation:

1. **Upload Documents** - Add your tax lien documents via `/upload`
2. **Test Chat** - Ask questions via `/chat`
3. **Explore API** - Check API docs at `/api/chat`
4. **Customize** - Modify RAG parameters in `lib/retrieval.ts`

## Production Deployment

### Environment Setup

1. Set production environment variables
2. Update `DATABASE_URL` to production database
3. Ensure `OPENAI_API_KEY` is from production account

### Build

```bash
npm run build
npm start
```

### Recommended Hosting

- **Vercel** - Optimal for Next.js (automatic deployments)
- **Railway** - Easy PostgreSQL + app hosting
- **Fly.io** - Global edge deployment
- **AWS/GCP/Azure** - Enterprise solutions

### Database Considerations

- Use connection pooling for production
- Set up automated backups
- Monitor query performance
- Scale pgvector indexes as data grows

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in terminal
3. Check database connection
4. Verify environment variables
5. Clear cache and rebuild
