"use client";

import React from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FileDropzone } from "@/components/excel/file-dropzone";
import { FileSummaryCard } from "@/components/excel/file-summary-card";
import { useExcelData } from "@/context/excel-context";

export default function Page() {
  const { records, pnlReport } = useExcelData();
  const hasData = records.length > 0 || Boolean(pnlReport);

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background p-4 md:p-8 text-foreground">
      <div className="w-full max-w-5xl space-y-6">
        <Card className="border border-border bg-card shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Flipkart Seller Analytics Platform
            </CardTitle>
            <CardDescription className="text-muted-foreground max-w-2xl mx-auto">
              Upload your official Flipkart reports (<code className="text-xs bg-muted px-1 py-0.5 rounded">.xlsx</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">.xls</code>, or{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">.csv</code>).
              Supports <strong>SKU-level P&L + Orders P&L</strong> workbooks and <strong>Returns Reports</strong> with automated sheet detection and domain reducers.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!hasData ? <FileDropzone /> : <FileSummaryCard />}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border bg-muted/20 px-6 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Modular Domain Reducer Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Ready for report upload</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
