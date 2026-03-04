"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { documentsApi } from "@/lib/documentsApi";
import { DocumentCategory } from "@/lib/documentsTypes";
import CreateCategoryModal from "@/components/documents/CreateCategoryModal";

// Shadcn UI imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import { Folder, FileText, Clock, Users } from "lucide-react";

export default function DepartmentPage() {
  const { department } = useParams();
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const deptLabel = String(department).replace(/-/g, " ");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await documentsApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [department]);

  const totalFiles = categories.reduce(
    (acc, cat) => acc + (cat.filesCount || 0),
    0,
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/documents">Documents</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize">
                  {deptLabel}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight capitalize bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {deptLabel}
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {totalFiles} {totalFiles === 1 ? "file" : "files"} •{" "}
                {categories.length} categories
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </Button>
              </div>

              {/* Modal */}
              <CreateCategoryModal
                deptLabel={deptLabel}
                onCreated={fetchCategories}
                createCategory={(name) => documentsApi.createCategory(name)}
              />
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Loading skeletons */}
          {loading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-2 pt-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-12 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : categories.length === 0 ? (
            /* Empty state */
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-primary/10 p-6 mb-6">
                  <Folder className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  No categories yet
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Get started by creating your first category. Organize your
                  documents and make them easily accessible to your team.
                </p>
                <CreateCategoryModal
                  deptLabel={deptLabel}
                  onCreated={fetchCategories}
                  createCategory={(name) => documentsApi.createCategory(name)}
                />
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            /* Grid view */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/documents/${department}/${cat._id}`}
                  className="block group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
                >
                  <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="rounded-xl p-3 bg-primary/10 text-primary border border-primary/20">
                          <Folder className="h-6 w-6" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {cat.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span>
                            {cat.filesCount ?? 0}{" "}
                            {cat.filesCount === 1 ? "file" : "files"}
                          </span>
                          {cat.updatedAt && (
                            <>
                              <span>•</span>
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {new Date(cat.updatedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="px-6 py-4 bg-muted/50 border-t">
                      <div className="flex items-center justify-between w-full text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Department
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 gap-1">
                          Open
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="space-y-2">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/documents/${department}/${cat._id}`}
                  className="block group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="rounded-lg p-2 bg-primary/10 text-primary border border-primary/20">
                            <Folder className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{cat.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{cat.filesCount ?? 0} files</span>
                              {cat.updatedAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Updated{" "}
                                    {new Date(
                                      cat.updatedAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);
