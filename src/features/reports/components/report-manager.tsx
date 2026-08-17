"use client";

import React, { useRef } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useExcelData } from "@/context/excel-context";
import { useExcelParser } from "@/hooks/use-excel-parser";
import { ReportTypeDialog } from "@/components/excel/report-type-dialog";

export function ReportManager() {
  const {
    pnlReport,
    records,
    uploadedReportsState,
    clearPnlData,
    clearReturnsData,
  } = useExcelData();

  const {
    fileInputRef,
    handleFileChange,
    isTypeDialogOpen,
    setIsTypeDialogOpen,
    pendingFile,
    detectionResult,
    processSelectedReport,
  } = useExcelParser();

  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  const handleAdditionalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Uploaded Reports Summary Box */}
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Flipkart Datasets
              </span>
              {uploadedReportsState.bothActive ? (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Complete Order Journey Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {uploadedReportsState.pnlActive ? "1 of 2 Uploaded (P&L)" : "1 of 2 Uploaded (Returns)"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={additionalFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleAdditionalFile}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => additionalFileInputRef.current?.click()}
                className="h-7 text-xs gap-1.5 bg-background cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Upload Additional Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Profit & Loss Report Card */}
            <div className={`p-3 rounded-lg border transition-all ${uploadedReportsState.pnlActive ? "bg-muted/30 border-border" : "bg-muted/10 border-dashed border-border/70"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md shrink-0 ${uploadedReportsState.pnlActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">Flipkart Profit & Loss Report</span>
                      {uploadedReportsState.pnlActive && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
                      )}
                    </div>
                    {uploadedReportsState.pnlActive && pnlReport ? (
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {pnlReport.fileName} • {pnlReport.skuLevel.length} SKUs • {pnlReport.orders.length} Order items
                        {pnlReport.metadata?.ordersReceivedPeriod && ` • ${pnlReport.metadata.ordersReceivedPeriod}`}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Not uploaded yet. Upload to enable order-level economics and SKU profitability.
                      </p>
                    )}
                  </div>
                </div>

                {uploadedReportsState.pnlActive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearPnlData}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                    title="Remove P&L Report"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* 2. Returns Report Card */}
            <div className={`p-3 rounded-lg border transition-all ${uploadedReportsState.returnsActive ? "bg-muted/30 border-border" : "bg-muted/10 border-dashed border-border/70"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md shrink-0 ${uploadedReportsState.returnsActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">Flipkart Returns Report</span>
                      {uploadedReportsState.returnsActive && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
                      )}
                    </div>
                    {uploadedReportsState.returnsActive ? (
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {uploadedReportsState.returnsFileName || "Returns Report"} • {records.length.toLocaleString()} Returns tracked
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Not uploaded yet. Upload to enable 43-column reverse logistics and return journey tracking.
                      </p>
                    )}
                  </div>
                </div>

                {uploadedReportsState.returnsActive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearReturnsData}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                    title="Remove Returns Report"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {pendingFile && (
        <ReportTypeDialog
          isOpen={isTypeDialogOpen}
          onClose={() => setIsTypeDialogOpen(false)}
          fileName={pendingFile.name}
          detection={detectionResult}
          onConfirm={(selectedType) => processSelectedReport(pendingFile, selectedType)}
        />
      )}
    </div>
  );
}
