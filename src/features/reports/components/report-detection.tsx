"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  Layers,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ReportType, REPORT_TYPE_OPTIONS, ReportDetectionResult } from "../types/report.types";

interface ReportDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  detection: ReportDetectionResult | null;
  onConfirm: (selectedType: ReportType) => void;
}

export function ReportDetectionDialog({
  isOpen,
  onClose,
  fileName,
  detection,
  onConfirm,
}: ReportDetectionDialogProps) {
  const [selectedType, setSelectedType] = useState<ReportType>("profit_loss");

  useEffect(() => {
    if (detection?.type && detection.type !== "unknown") {
      setSelectedType(detection.type);
    }
  }, [detection]);

  const handleContinue = () => {
    onConfirm(selectedType);
  };

  const confidencePct = detection ? (detection.confidence * 100).toFixed(0) : "95";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-background text-foreground border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Workbook Inspection & Detection
            </span>
            {detection && detection.confidence >= 0.8 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Confidence: {confidencePct}%
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
            Report Type Auto-Detected
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Inspected <strong className="text-foreground font-mono">{fileName}</strong>. Confirm the detected report type or choose a custom schema.
          </DialogDescription>
        </DialogHeader>

        {/* Sheets Detected Preview */}
        {detection && detection.sheets && detection.sheets.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Sheets Found in Workbook ({detection.sheets.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {detection.sheets.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-background border border-border text-foreground"
                >
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Type Selector */}
        <div className="py-2">
          <RadioGroup
            value={selectedType}
            onValueChange={(val) => setSelectedType(val as ReportType)}
            className="space-y-2.5"
          >
            {REPORT_TYPE_OPTIONS.map((option) => {
              const isSelected = selectedType === option.id;
              const isSuggested = detection?.type === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => option.supported && setSelectedType(option.id)}
                  className={`flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/40"
                  } ${!option.supported ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      disabled={!option.supported}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={option.id}
                          className="font-bold text-xs cursor-pointer text-foreground"
                        >
                          {option.title}
                        </Label>
                        {isSuggested && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            Auto-Detected
                          </Badge>
                        )}
                        {!option.supported && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {option.description}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground">
                        <span>Expected Sheets:</span>
                        {option.expectedSheets.map((sh) => (
                          <Badge
                            key={sh}
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-3.5 font-mono"
                          >
                            {sh}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            className="text-xs gap-1.5 cursor-pointer"
          >
            Continue to Ingestion
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
