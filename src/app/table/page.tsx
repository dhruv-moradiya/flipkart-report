"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, FileQuestion, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReportImports } from "@/hooks/use-report-imports";

function TableRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportIdParam = searchParams.get("reportId");
  const { data: allReports = [], isLoading } = useReportImports();

  useEffect(() => {
    // 1. If explicit query param was passed, redirect to params route
    if (reportIdParam) {
      router.replace(`/table/${reportIdParam}`);
      return;
    }

    // 2. Otherwise find the latest Returns report and navigate to its params route
    if (!isLoading && allReports.length > 0) {
      const returnReports = allReports.filter(
        (r) =>
          r.reportType === "FLIPKART_RETURNS" ||
          r.fileName.toLowerCase().includes("return") ||
          (r.skuCount === 0 && (r.returnCount || 0) > 0)
      );

      if (returnReports.length > 0) {
        router.replace(`/table/${returnReports[0]._id}`);
      }
    }
  }, [reportIdParam, allReports, isLoading, router]);

  if (isLoading || reportIdParam) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Navigating to Flipkart Returns Report...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
      <Card className="max-w-md w-full text-center p-8 border-border shadow-xs">
        <CardContent className="space-y-4 pt-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">
              No Flipkart Returns Report Loaded
            </h2>
            <p className="text-xs text-muted-foreground">
              Upload your official 43-column Flipkart Returns report (.csv or .xlsx) to view
              reverse logistics analytics and the interactive table.
            </p>
          </div>
          <Button asChild className="w-full gap-2 mt-4 text-xs cursor-pointer">
            <Link href="/">
              <Upload className="h-4 w-4" />
              Upload Flipkart Report
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function TablePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading Returns Table...
            </p>
          </div>
        </main>
      }
    >
      <TableRedirectHandler />
    </Suspense>
  );
}
