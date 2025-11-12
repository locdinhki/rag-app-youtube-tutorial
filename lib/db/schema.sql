-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for storing document chunks with embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_name TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(1536), -- OpenAI ada-002 embedding dimension
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create an index on document_name for faster queries
CREATE INDEX IF NOT EXISTS document_chunks_document_name_idx
ON document_chunks (document_name);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_document_chunks_updated_at
BEFORE UPDATE ON document_chunks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Example query for similarity search:
-- SELECT id, document_name, chunk_text, 1 - (embedding <=> '[your_query_embedding_vector]'::vector) as similarity
-- FROM document_chunks
-- ORDER BY embedding <=> '[your_query_embedding_vector]'::vector
-- LIMIT 5;
