import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center space-y-6 max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Tax Lien Research Assistant
        </h1>

        <p className="text-xl text-muted-foreground">
          An intelligent research assistant powered by RAG (Retrieval Augmented Generation)
          to help you find and understand tax lien information quickly and accurately.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/upload"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Upload Documents
          </Link>
          <Link
            href="/chat"
            className="px-8 py-3 border border-input rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Start Chat
          </Link>
        </div>

        <div className="pt-12 grid sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Upload & Process</h3>
            <p className="text-sm text-muted-foreground">
              Upload your tax lien documents to create a searchable knowledge base
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Intelligent Search</h3>
            <p className="text-sm text-muted-foreground">
              Vector-based similarity search finds the most relevant information
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">AI-Powered Answers</h3>
            <p className="text-sm text-muted-foreground">
              Get accurate answers based on your documents using GPT-4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
