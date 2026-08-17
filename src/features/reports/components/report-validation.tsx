"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParserDiagnostics } from "../validation/parser-diagnostics";

interface ReportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  diagnostics?: ParserDiagnostics | null;
  onProceed: () => void;
}

export function ReportValidationModal({
  isOpen,
  onClose,
  fileName,
  diagnostics,
  onProceed,
}: ReportValidationModalProps) {
  if (!diagnostics) return null;

  const hasErrors = diagnostics.errors && diagnostics.errors.length > 0;
  const hasWarnings = diagnostics.warnings && diagnostics.warnings.length > 0;
  const unknownCount = diagnostics.unknownFields?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-background text-foreground border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Ingestion Verification & Integrity Check
            </span>
            <Badge
              variant={hasErrors ? "destructive" : "secondary"}
              className="text-[10px] px-1.5 py-0 h-4 gap-1"
            >
              {hasErrors ? "Validation Failed" : "Integrity Verified"}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
            Report Ingestion Status
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Validation analysis for <strong className="text-foreground font-mono">{fileName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Verification Checklist */}
        <div className="space-y-2 py-2">
          <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/20 border border-border text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Report Schema Detected</span>
              </span>
              <Badge variant="outline" className="text-[10px] font-mono capitalize">
                {diagnostics.reportType.replace("_", " ")} ({diagnostics.schemaVersion || "v1"})
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Multi-Row Headers & Merged Ranges</span>
              </span>
              <span className="font-mono text-muted-foreground text-[11px]">
                {diagnostics.mergedRangesDetected} ranges propagated
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Hidden & Collapsed Columns Included</span>
              </span>
              <span className="font-mono text-muted-foreground text-[11px]">
                {diagnostics.hiddenColumnsDetected} hidden parsed
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Financial & Fee Fields Mapped</span>
              </span>
              <span className="font-mono text-muted-foreground text-[11px]">
                {diagnostics.mappedFields?.length || 0} canonical fields
              </span>
            </div>
          </div>

          {/* Warnings Section */}
          {hasWarnings && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1 text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Ingestion Warnings ({diagnostics.warnings.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono">
                {diagnostics.warnings.slice(0, 3).map((w, idx) => (
                  <li key={idx} className="truncate">{w}</li>
                ))}
                {diagnostics.warnings.length > 3 && (
                  <li className="italic">+ {diagnostics.warnings.length - 3} more warnings</li>
                )}
              </ul>
            </div>
          )}

          {/* Errors Section */}
          {hasErrors && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs space-y-1 text-destructive">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <XCircle className="h-3.5 w-3.5" />
                <span>Critical Schema Errors ({diagnostics.errors.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono">
                {diagnostics.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground pt-1">
                Cannot safely proceed without required fields. Please check the Excel file format.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Review Mapping
          </Button>

          <Button
            type="button"
            disabled={hasErrors}
            onClick={onProceed}
            className="text-xs gap-1.5 cursor-pointer"
          >
            Continue to Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
