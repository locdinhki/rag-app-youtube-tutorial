"use client";

import DocumentUpload from "@/components/document-upload";
import DocumentList from "@/components/document-list";

export default function UploadPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Upload County Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload markdown (.md) files containing tax lien redemption guidelines
        </p>
      </div>

      {/* Upload Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">New Document</h2>
        <DocumentUpload />
      </div>

      {/* Document List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
        <DocumentList />
      </div>
    </div>
  );
}
