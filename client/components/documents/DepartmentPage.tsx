"use client";
import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { documentsApi } from "@/lib/documentsApi";
import { DocumentCategory } from "@/lib/documentsTypes";
import CreateCategoryModal from "@/components/documents/CreateCategoryModal";
import UpdateCategoryModal from "@/components/documents/updateCategoryModal";

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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";
import {
  Folder,
  FileText,
  Clock,
  Users,
  Search,
  ArrowUpDown,
  X,
  Trash,
  Edit,
} from "lucide-react";

type SortKey = "files-desc" | "files-asc" | "updated-desc" | "updated-asc";

const SORT_LABELS: Record<SortKey, string> = {
  "files-desc": "Most files",
  "files-asc": "Fewest files",
  "updated-desc": "Recently updated",
  "updated-asc": "Least recently updated",
};

export function DepartmentPage() {
  const { department } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const user = useAuthStore((state) => state.user);

  const query = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") ?? "name-asc") as SortKey;
  const view = (searchParams.get("view") ?? "grid") as "grid" | "list";

  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const deptLabel = String(department).replace(/-/g, " ");

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await documentsApi.getCategories({ q: query, sort });
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }, [query, sort]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const totalFiles = categories.reduce(
    (acc, cat) => acc + (cat.filesCount ?? 0),
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
                  variant={view === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setParam("view", "grid")}
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
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setParam("view", "list")}
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

              <CreateCategoryModal
                deptLabel={deptLabel}
                onCreated={fetchCategories}
                createCategory={(name) => documentsApi.createCategory(name)}
              />
            </div>
          </div>

          {/* Search + Sort toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search categories…"
                defaultValue={query}
                onChange={(e) => setParam("q", e.target.value)}
                className="pl-9 pr-9"
              />
              {query && (
                <button
                  onClick={() => setParam("q", "")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 shrink-0">
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                  <span className="sm:hidden">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(v) => setParam("sort", v)}
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <DropdownMenuRadioItem key={key} value={key}>
                      {SORT_LABELS[key]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Result count when searching */}
          {query && !loading && (
            <p className="text-sm text-muted-foreground mb-4">
              {categories.length === 0
                ? `No categories match "${query}"`
                : `${categories.length} ${categories.length === 1 ? "category" : "categories"} found`}
            </p>
          )}

          <Separator className="mb-8" />

          {/* Loading */}
          {loading ? (
            view === "grid" ? (
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
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-primary/10 p-6 mb-6">
                  {query ? (
                    <Search className="h-12 w-12 text-primary" />
                  ) : (
                    <Folder className="h-12 w-12 text-primary" />
                  )}
                </div>
                {query ? (
                  <>
                    <h3 className="text-2xl font-semibold mb-3">
                      No results found
                    </h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                      No categories match{" "}
                      <span className="font-medium">"{query}"</span>. Try a
                      different search term.
                    </p>
                    <Button variant="outline" onClick={() => setParam("q", "")}>
                      Clear search
                    </Button>
                  </>
                ) : (
                  <>
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
                      createCategory={(name) =>
                        documentsApi.createCategory(name)
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Card
                  key={cat._id}
                  className="group relative h-full flex flex-col hover:scale-[1.02] hover:ring-2 hover:ring-primary/20 hover:shadow-xl transition-all duration-300 overflow-hidden bg-card border-muted/60"
                >
                  {/* Action Overlay: Top Right */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <UpdateCategoryModal
                      deptLabel={cat.name}
                      onCreated={fetchCategories}
                      createCategory={(name) =>
                        documentsApi.renameCategory(name, cat._id)
                      }
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-red-50 text-red-600 border"
                      onClick={(e) => {
                        e.preventDefault();
                        documentsApi.deleteCategory(cat._id);
                        fetchCategories();
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="p-6 flex-1">
                    <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-100 dark:border-amber-900/30">
                      <Folder className="h-8 w-8 text-yellow-500 fill-yellow-500/20" />
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-xl tracking-tight capitalize truncate group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-sm text-muted-foreground/80">
                        <div className="flex items-center gap-1.5 py-1 px-2 rounded-md bg-secondary/50">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground/80">
                            {cat.filesCount ?? 0}{" "}
                            {cat.filesCount === 1 ? "file" : "files"}
                          </span>
                        </div>
                        {cat.updatedAt && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {new Date(cat.updatedAt).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {/* Footer acts as the Link */}
                  <CardFooter className="p-0 border-t">
                    <Link
                      href={`/documents/${department}/${cat._id}`}
                      className="flex items-center justify-between w-full px-6 py-4 bg-muted/20 hover:bg-primary/[0.03] transition-colors group/link"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background shadow-inner border border-muted/50 group-hover/link:border-primary/30 transition-colors">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 leading-none mb-1">
                            Ownership
                          </p>
                          <p className="text-sm font-semibold text-foreground leading-none">
                            {user?.role === "admin"
                              ? cat.department
                              : "Restricted"}
                          </p>
                        </div>
                      </div>

                      <div className="h-8 w-8 rounded-full flex items-center justify-center group-hover/link:bg-primary group-hover/link:text-primary-foreground transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
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
