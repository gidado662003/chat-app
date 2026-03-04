"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { documentsApi } from "@/lib/documentsApi";
import { DocumentFile } from "@/lib/documentsTypes";

// Shadcn UI imports
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  FileText,
  Upload,
  Download,
  Presentation,
  X,
  ChevronLeft,
} from "lucide-react";

export default function CategoryPage() {
  const { department, category } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [fileName, setFileName] = useState("");

  const deptLabel = String(department).replace(/-/g, " ");
  const catLabel = String(category).replace(/-/g, " ");

  const fetchFiles = async () => {
    setLoading(true);
    try {
      if (!category) return;
      const data = await documentsApi.getFilesByCategory(category);
      setFiles(data);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pptx")) {
      alert("Please select a .pptx file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    // pre-fill both fields from the file name, user can edit
    const nameWithoutExt = file.name.replace(".pptx", "");
    setDisplayName(nameWithoutExt);
    setFileName(nameWithoutExt);
  };

  const handleUpload = async () => {
    if (!selectedFile || !displayName.trim() || !fileName.trim()) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", displayName.trim());
    formData.append("fileName", fileName.trim());
    formData.append("category", String(category));
    try {
      await documentsApi.uploadFile(formData);
      await fetchFiles();
      handleCancel();
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setDisplayName("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    fetchFiles();
  }, [department, category]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/documents">Documents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/documents/${department}`}
                className="capitalize"
              >
                {deptLabel}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="capitalize">{catLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold capitalize flex items-center gap-2">
              <Link
                href={`/documents/${department}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              {catLabel}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {files.length} {files.length === 1 ? "file" : "files"}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload .pptx
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Selected file — name inputs + confirm */}
        {selectedFile && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="p-5">
              {/* File info row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                    <Presentation className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={uploading}
                  className="shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Name inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="space-y-1.5">
                  <Label htmlFor="display-name" className="text-xs">
                    Display Name
                  </Label>
                  <Input
                    id="display-name"
                    placeholder="e.g. Q1 Onboarding Deck"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    How the file appears in the list
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="file-name" className="text-xs">
                    File Name
                  </Label>
                  <div className="flex items-center">
                    <Input
                      id="file-name"
                      placeholder="e.g. q1-onboarding-deck"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      disabled={uploading}
                      className="rounded-r-none"
                    />
                    <span className="text-xs text-muted-foreground bg-muted border border-l-0 border-input rounded-r-md px-3 h-9 flex items-center shrink-0">
                      .pptx
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for storage reference
                  </p>
                </div>
              </div>

              {/* Confirm button */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={
                    uploading || !displayName.trim() || !fileName.trim()
                  }
                >
                  {uploading ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Confirm Upload
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No files yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Upload your first .pptx file to get started
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <Card
                key={file._id}
                className="hover:bg-muted/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/documents/${department}/${category}/${file._id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                        <Presentation className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.createdAt).toLocaleDateString()} •{" "}
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 shrink-0"
                      asChild
                    >
                      <a href={`/api/documents/download/${file._id}`} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
