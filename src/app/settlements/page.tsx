"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReportImports } from "@/hooks/use-report-imports";

export default function SettlementsIndexPage() {
  const router = useRouter();
  const { data: allReports = [], isLoading } = useReportImports();

  // Find latest settlement report
  const latestSettlementReport = allReports.find(
    (r) =>
      r.reportType === "FLIPKART_SETTLEMENTS" ||
      r.fileName.toLowerCase().includes("settled") ||
      r.fileName.toLowerCase().includes("settlement")
  );

  useEffect(() => {
    if (latestSettlementReport?._id) {
      router.replace(`/settlements/${latestSettlementReport._id}`);
    }
  }, [latestSettlementReport, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Checking for uploaded Settled Transactions reports...</span>
      </div>
    );
  }

  if (latestSettlementReport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Redirecting to latest Settled Transactions report...</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4 space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
        <CreditCard className="h-7 w-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          No Settled Transactions Report Uploaded Yet
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Upload your official Flipkart Seller Settlement report (e.g. <code>JUL_Settled Transactions(1).xlsx</code>) to reconcile bank payouts, GST/TCS/TDS credits, and order-level fees.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Button asChild size="sm" className="text-xs cursor-pointer">
          <Link href="/">
            <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
            Upload Settlement Report
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm" className="text-xs cursor-pointer">
          <Link href="/reports">
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            View Reports Archive
          </Link>
        </Button>
      </div>
    </div>
  );
}
