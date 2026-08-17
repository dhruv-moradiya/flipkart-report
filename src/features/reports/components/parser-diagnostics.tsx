"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Layers,
  FileSpreadsheet,
  Columns,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParserDiagnostics } from "../validation/parser-diagnostics";

interface ParserDiagnosticsProps {
  diagnostics?: ParserDiagnostics | null;
  className?: string;
}

export function ParserDiagnosticsPanel({
  diagnostics,
  className = "",
}: ParserDiagnosticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!diagnostics) return null;

  const hasWarnings = diagnostics.warnings && diagnostics.warnings.length > 0;
  const hasErrors = diagnostics.errors && diagnostics.errors.length > 0;
  const unknownCount = diagnostics.unknownFields?.length || 0;

  return (
    <div
      className={`rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3.5 transition-all shadow-2xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <FileSpreadsheet className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-[-0.005em] font-sans">
            Ingestion Engine Diagnostics
          </span>
          <Badge
            variant="outline"
            className="text-[11px] font-medium leading-none px-2 py-0.5 tabular-nums font-sans"
          >
            Confidence: {(diagnostics.confidence * 100).toFixed(0)}%
          </Badge>
          {diagnostics.hiddenColumnsDetected > 0 && (
            <Badge
              variant="secondary"
              className="text-[11px] font-medium leading-none px-2 py-0.5 tabular-nums font-sans"
            >
              {diagnostics.hiddenColumnsDetected} Hidden Cols Parsed
            </Badge>
          )}
          {unknownCount > 0 && (
            <Badge
              variant="outline"
              className="text-[11px] font-medium leading-none px-2 py-0.5 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 tabular-nums font-sans"
            >
              {unknownCount} Unknown Col(s)
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground cursor-pointer self-start sm:self-auto px-2 font-sans"
        >
          <span>{isExpanded ? "Hide Details" : "View Diagnostics Details"}</span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 bg-background rounded-lg border border-border/80 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.01em] block font-sans">
            Columns Detected
          </span>
          <span className="font-bold text-foreground tabular-nums font-sans tracking-[-0.02em] text-sm">
            {diagnostics.columnsDetected}
          </span>
        </div>

        <div className="p-2.5 bg-background rounded-lg border border-border/80 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.01em] block font-sans">
            Hidden / Merged
          </span>
          <span className="font-normal text-muted-foreground tabular-nums text-xs">
            <strong className="text-foreground font-semibold">
              {diagnostics.hiddenColumnsDetected}
            </strong>{" "}
            hidden •{" "}
            <strong className="text-foreground font-semibold">
              {diagnostics.mergedRangesDetected}
            </strong>{" "}
            merged
          </span>
        </div>

        <div className="p-2.5 bg-background rounded-lg border border-border/80 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.01em] block font-sans">
            Mapped Fields
          </span>
          <span className="font-bold text-foreground tabular-nums font-sans tracking-[-0.02em] text-sm">
            {diagnostics.mappedFields?.length || 0}
          </span>
        </div>

        <div className="p-2.5 bg-background rounded-lg border border-border/80 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.01em] block font-sans">
            Status
          </span>
          <div className="font-medium text-xs flex items-center gap-1 pt-0.5">
            {hasErrors ? (
              <span className="text-destructive flex items-center gap-1 font-semibold">
                <XCircle className="h-3.5 w-3.5" /> Errors
              </span>
            ) : hasWarnings ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> Warnings
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-border/80 text-xs">
          {/* Warnings List */}
          {hasWarnings && (
            <div className="space-y-1.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Ingestion Warnings ({diagnostics.warnings.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] font-normal leading-relaxed">
                {diagnostics.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Unknown Columns List */}
          {unknownCount > 0 && (
            <div className="space-y-1.5 p-3 rounded-lg bg-background border border-border">
              <span className="font-semibold text-xs text-foreground block font-sans">
                Unknown / Unmapped Columns Detected ({unknownCount}):
              </span>
              <p className="text-[11px] text-muted-foreground font-normal">
                These fields were not matched to the current canonical schema
                but have been safely preserved in raw record data:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {diagnostics.unknownFields.map((f, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[10px] font-mono font-normal"
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Detected Sheets */}
          {diagnostics.sheetsDetected && diagnostics.sheetsDetected.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-lg bg-background border border-border">
              <span className="font-semibold text-xs text-foreground block font-sans">
                Detected Sheets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {diagnostics.sheetsDetected.map((sh, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-[11px] font-mono font-medium px-2 py-0.5"
                  >
                    {sh}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
