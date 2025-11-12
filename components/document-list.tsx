"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Trash2 } from "lucide-react";
import {
  COLORADO_COUNTIES,
  COUNTY_COLORS,
  type ColoradoCounty,
  type UploadedDocument,
} from "@/lib/types";
import { fetchDocuments, deleteDocument } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

interface DocumentListProps {
  onUploadClick?: () => void;
}

export default function DocumentList({ onUploadClick }: DocumentListProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    documentId: string | null;
  }>({ open: false, documentId: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Fetch documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast({
        title: 'Failed to load documents',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments =
    selectedCounty === "all"
      ? documents
      : documents.filter((doc) => doc.county === selectedCounty);

  const handleDelete = (documentId: string) => {
    setDeleteDialog({ open: true, documentId });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.documentId) return;

    setIsDeleting(true);
    try {
      await deleteDocument(deleteDialog.documentId);

      // Remove from state
      setDocuments((docs) =>
        docs.filter((doc) => doc.id !== deleteDialog.documentId)
      );

      toast({
        title: 'Document deleted',
        description: 'Document and all associated chunks have been removed',
      });

      setDeleteDialog({ open: false, documentId: null });
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: 'Failed to delete document',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-muted rounded w-20 mb-2"></div>
            <div className="h-6 bg-muted rounded w-full"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by County:</label>
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {COLORADO_COUNTIES.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredDocuments.length}{" "}
          {filteredDocuments.length === 1 ? "document" : "documents"}
        </div>
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredDocuments.length === 0 ? (
        // Empty State
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No documents uploaded yet
            </h3>
            <p className="text-muted-foreground max-w-md">
              Upload county guidelines to get started. Your documents will be
              processed and made searchable through the chat interface.
            </p>
          </CardContent>
        </Card>
      ) : (
        // Document Cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={COUNTY_COLORS[doc.county]}
                  >
                    {doc.county}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg line-clamp-2">
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Year:</span>
                    <span className="font-medium text-foreground">
                      {doc.year}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uploaded:</span>
                    <span className="font-medium text-foreground">
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>File size:</span>
                    <span className="font-medium text-foreground">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>
                  {doc.chunksProcessed && (
                    <div className="flex items-center justify-between">
                      <span>Chunks:</span>
                      <span className="font-medium text-foreground">
                        {doc.chunksProcessed}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground truncate">
                    {doc.fileName}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, documentId: deleteDialog.documentId })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone. All associated chunks and embeddings will be removed
              from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, documentId: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
