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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParserDiagnostics } from "../validation/parser-diagnostics";

interface ParserDiagnosticsProps {
  diagnostics?: ParserDiagnostics | null;
  className?: string;
}

export function ParserDiagnosticsPanel({ diagnostics, className = "" }: ParserDiagnosticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!diagnostics) return null;

  const hasWarnings = diagnostics.warnings && diagnostics.warnings.length > 0;
  const hasErrors = diagnostics.errors && diagnostics.errors.length > 0;
  const unknownCount = diagnostics.unknownFields?.length || 0;

  return (
    <div className={`rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Ingestion Engine Diagnostics
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            Confidence: {(diagnostics.confidence * 100).toFixed(0)}%
          </Badge>
          {diagnostics.hiddenColumnsDetected > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {diagnostics.hiddenColumnsDetected} Hidden Cols Parsed
            </Badge>
          )}
          {unknownCount > 0 && (
            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 px-1.5 py-0">
              {unknownCount} Unknown Col(s)
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer self-start sm:self-auto"
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {isExpanded ? "Hide Details" : "View Diagnostics Details"}
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 bg-muted/20 rounded border border-border/50">
          <span className="text-[10px] text-muted-foreground block">Columns Detected</span>
          <span className="font-mono font-bold text-foreground">{diagnostics.columnsDetected}</span>
        </div>
        <div className="p-2 bg-muted/20 rounded border border-border/50">
          <span className="text-[10px] text-muted-foreground block">Hidden / Merged</span>
          <span className="font-mono text-foreground">
            {diagnostics.hiddenColumnsDetected} hidden • {diagnostics.mergedRangesDetected} merged
          </span>
        </div>
        <div className="p-2 bg-muted/20 rounded border border-border/50">
          <span className="text-[10px] text-muted-foreground block">Mapped Fields</span>
          <span className="font-mono font-bold text-foreground">{diagnostics.mappedFields?.length || 0}</span>
        </div>
        <div className="p-2 bg-muted/20 rounded border border-border/50">
          <span className="text-[10px] text-muted-foreground block">Status</span>
          <span className="font-medium flex items-center gap-1">
            {hasErrors ? (
              <span className="text-destructive flex items-center gap-1 font-bold">
                <XCircle className="h-3.5 w-3.5" /> Errors
              </span>
            ) : hasWarnings ? (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Warnings
              </span>
            ) : (
              <span className="text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-border text-xs">
          {/* Warnings List */}
          {hasWarnings && (
            <div className="space-y-1 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Ingestion Warnings ({diagnostics.warnings.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono">
                {diagnostics.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Unknown Columns List */}
          {unknownCount > 0 && (
            <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border">
              <span className="font-bold text-[11px] text-foreground block">
                Unknown / Unmapped Columns Detected ({unknownCount}):
              </span>
              <p className="text-[11px] text-muted-foreground">
                These fields were not matched to the current canonical schema but have been safely preserved in raw record data:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {diagnostics.unknownFields.map((f, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px] font-mono">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Detected Sheets */}
          {diagnostics.sheetsDetected && diagnostics.sheetsDetected.length > 0 && (
            <div className="space-y-1">
              <span className="font-bold text-[11px] text-muted-foreground block uppercase">
                Detected Sheets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {diagnostics.sheetsDetected.map((sh, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] font-mono">
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
