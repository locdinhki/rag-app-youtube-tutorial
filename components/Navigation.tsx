import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Tax Lien RAG
          </Link>
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-foreground hover:text-foreground/80 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/upload"
              className="text-foreground hover:text-foreground/80 transition-colors"
            >
              Upload
            </Link>
            <Link
              href="/chat"
              className="text-foreground hover:text-foreground/80 transition-colors"
            >
              Chat
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
