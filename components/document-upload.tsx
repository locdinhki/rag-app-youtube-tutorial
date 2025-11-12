"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { COLORADO_COUNTIES, type ColoradoCounty } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CURRENT_YEAR = 2025;

interface DocumentMetadata {
  county: ColoradoCounty | "";
  title: string;
  year: number;
}

export default function DocumentUpload() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    county: "",
    title: "",
    year: CURRENT_YEAR,
  });
  const [preview, setPreview] = useState<{
    content: string;
    headers: string[];
    size: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const extractHeaders = (content: string): string[] => {
    const headerRegex = /^#{1,2}\s+(.+)$/gm;
    const headers: string[] = [];
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      headers.push(match[1]);
    }
    return headers.slice(0, 5); // Show first 5 headers
  };

  const validateFile = (file: File): string | null => {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      return "Only markdown files (.md, .markdown) are accepted";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    setError("");

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);

    // Read file content for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const headers = extractHeaders(content);
      setPreview({
        content: content.substring(0, 500),
        headers,
        size: formatFileSize(file.size),
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setMetadata({
      county: "",
      title: "",
      year: CURRENT_YEAR,
    });
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !metadata.county || !metadata.title) return;

    setIsUploading(true);
    setError("");

    try {
      const { uploadDocument } = await import("@/lib/api-client");

      // Upload document with real API
      const result = await uploadDocument(selectedFile, {
        county: metadata.county,
        title: metadata.title,
        year: metadata.year,
      });

      // Show success toast
      toast({
        title: "Document uploaded successfully",
        description: `"${metadata.title}" processed into ${result.chunkCount} chunks from ${result.sections?.length || 0} sections`,
      });

      // Clear form
      handleClear();
    } catch (err) {
      let errorMessage = "Failed to upload document. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const isFormValid =
    selectedFile && metadata.county && metadata.title && !isUploading;

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  Drag and drop your markdown file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Max 5MB • Markdown files (.md, .markdown)</p>
                <p>Files should contain structured sections with headers</p>
              </div>
            </div>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="mt-4 flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Metadata Form */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Document Information</h3>

          <div className="space-y-2">
            <Label htmlFor="county">County *</Label>
            <Select
              value={metadata.county}
              onValueChange={(value) =>
                setMetadata({ ...metadata, county: value as ColoradoCounty })
              }
              disabled={!selectedFile}
            >
              <SelectTrigger id="county">
                <SelectValue placeholder="Select a county" />
              </SelectTrigger>
              <SelectContent>
                {COLORADO_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              placeholder="Redemption Guidelines 2025"
              value={metadata.title}
              onChange={(e) =>
                setMetadata({ ...metadata, title: e.target.value })
              }
              disabled={!selectedFile}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              min="2000"
              max="2100"
              value={metadata.year}
              onChange={(e) =>
                setMetadata({ ...metadata, year: parseInt(e.target.value) })
              }
              disabled={!selectedFile}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-lg">Preview</h3>

            {preview.headers.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Detected Headers:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {preview.headers.map((header, index) => (
                    <li key={index}>• {header}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Content Preview:</p>
              <div className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto">
                {preview.content}
                {preview.content.length >= 500 && "..."}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <Button
        onClick={handleUpload}
        disabled={!isFormValid}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </>
        )}
      </Button>
    </div>
  );
}
