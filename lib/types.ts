// Colorado Counties
export const COLORADO_COUNTIES = [
  "Adams",
  "Arapahoe",
  "Boulder",
  "Clear Creek",
  "Denver",
  "Douglas",
  "El Paso",
  "Jefferson",
  "Larimer",
  "Pueblo",
  "Weld",
] as const;

export type ColoradoCounty = typeof COLORADO_COUNTIES[number];

// County color mapping for badges
export const COUNTY_COLORS: Record<ColoradoCounty, string> = {
  Adams: "bg-orange-100 text-orange-800 border-orange-200",
  Arapahoe: "bg-green-100 text-green-800 border-green-200",
  Boulder: "bg-blue-100 text-blue-800 border-blue-200",
  "Clear Creek": "bg-cyan-100 text-cyan-800 border-cyan-200",
  Denver: "bg-purple-100 text-purple-800 border-purple-200",
  Douglas: "bg-pink-100 text-pink-800 border-pink-200",
  "El Paso": "bg-red-100 text-red-800 border-red-200",
  Jefferson: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Larimer: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Pueblo: "bg-teal-100 text-teal-800 border-teal-200",
  Weld: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

// Document metadata
export interface DocumentMetadata {
  county: ColoradoCounty;
  title: string;
  year: number;
}

// Uploaded document structure
export interface UploadedDocument extends DocumentMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  chunksProcessed?: number;
}

// File upload result
export interface FileUploadResult {
  success: boolean;
  message: string;
  documentId?: string;
}

// Document chunk for RAG processing
export interface DocumentChunk {
  id: string; // generated unique ID
  documentId: string; // document identifier
  content: string;
  metadata: DocumentMetadata & {
    documentTitle: string;
    chunkIndex: number;
    totalChunks: number;
    sectionHeader?: string;
    subsectionHeader?: string;
  };
}

// Markdown section structure
export interface MarkdownSection {
  level: number; // 1, 2, or 3 for H1, H2, H3
  title: string;
  content: string;
  startPosition: number;
  endPosition: number;
}
