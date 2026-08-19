"use client";

import { FileDropzone } from "@/components/excel/file-dropzone";
import { HomeUploadedReports } from "@/components/reports/home-uploaded-reports";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useExcelData } from "@/context/excel-context";
import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Layers,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const { records, pnlReport } = useExcelData();
  const [showUploader, setShowUploader] = useState<boolean>(true);

  return (
    <main className="min-h-svh bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-6">
        {/* Top Header Card */}
        <Card className="border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="text-center pb-4 pt-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Flipkart Seller Financial & Profit Intelligence
            </CardTitle>
            <CardDescription className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-sm">
              Upload your monthly Flipkart reports to store persistent financial
              data, configure SKU unit costs, and track actual net profit over
              time.
            </CardDescription>

            {/* Quick Navigation Action Hub */}
            <div className="flex items-center justify-center gap-2 pt-3 flex-wrap">
              <Button
                asChild
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Link href="/analytics/actual-profit">
                  <Sparkles className="h-3.5 w-3.5" />
                  Actual Profit Intelligence
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Link href="/pnl">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  P&L Tables
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Link href="/analytics/compare">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Month Compare
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Link href="/sku-costs">
                  <Layers className="h-3.5 w-3.5" />
                  SKU Cost Master
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <Link href="/analytics/overview">
                  Multi-Route Analytics
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          {/* Upload Dropzone Section */}
          <CardContent className="space-y-4 border-t border-border pt-4 bg-muted/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UploadCloud className="h-4 w-4 text-primary" />
                Upload New Monthly P&L or Returns Report
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setShowUploader(!showUploader)}
              >
                {showUploader ? (
                  <>
                    Collapse <ChevronUp className="h-3.5 w-3.5 ml-1" />
                  </>
                ) : (
                  <>
                    Expand <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {showUploader && (
              <div className="pt-1">
                <FileDropzone />
              </div>
            )}
          </CardContent>

          {/* Uploaded Reports Directory Section */}
          <CardContent className="border-t border-border pt-6 pb-6 space-y-4">
            <HomeUploadedReports />
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border bg-muted/20 px-6 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>
                MongoDB Persistent Storage • Fastify Calculation Engine
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Backend Connected</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
