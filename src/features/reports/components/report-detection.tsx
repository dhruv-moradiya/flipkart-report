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
  Calendar,
  Tag,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportType, REPORT_TYPE_OPTIONS, ReportDetectionResult } from "../types/report.types";

interface ReportDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  detection: ReportDetectionResult | null;
  onConfirm: (
    selectedType: ReportType,
    customReportName?: string,
    selectedMonth?: number,
    selectedYear?: number
  ) => void;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEARS = [2024, 2025, 2026, 2027];

export function ReportDetectionDialog({
  isOpen,
  onClose,
  fileName,
  detection,
  onConfirm,
}: ReportDetectionDialogProps) {
  const [selectedType, setSelectedType] = useState<ReportType>("profit_loss");
  const [reportName, setReportName] = useState<string>(fileName);

  // Default to current or detected month/year
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear()
  );

  // Sync state when file / detection changes
  useEffect(() => {
    setReportName(fileName);

    if (detection?.type && detection.type !== "unknown") {
      setSelectedType(detection.type);
    }

    // Try detecting month from filename (e.g. "Aug 1 2026 To Aug 13 2026", "July-2026")
    const lowerName = fileName.toLowerCase();
    const monthIndex = MONTHS.findIndex((m) =>
      lowerName.includes(m.label.toLowerCase()) || lowerName.includes(m.label.toLowerCase().slice(0, 3))
    );
    if (monthIndex !== -1) {
      setSelectedMonth(MONTHS[monthIndex].value);
    }

    const yearMatch = fileName.match(/202[4-9]/);
    if (yearMatch) {
      setSelectedYear(parseInt(yearMatch[0], 10));
    }
  }, [fileName, detection]);

  const handleContinue = () => {
    onConfirm(selectedType, reportName.trim() || fileName, selectedMonth, selectedYear);
  };

  const confidencePct = detection ? (detection.confidence * 100).toFixed(0) : "95";
  const selectedMonthObj = MONTHS.find((m) => m.value === selectedMonth) || MONTHS[7];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-background text-foreground border-border shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Upload Report Details
            </span>
            {detection && detection.confidence >= 0.8 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Detected: {confidencePct}%
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
            Confirm Report Details & Period
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Review the report title, reporting period / date range, and detected workbook schema before ingestion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 1. Report Name Input */}
          <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-card">
            <Label htmlFor="report-name-input" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Report Name / Document Title
            </Label>
            <Input
              id="report-name-input"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g. August 2026 Monthly P&L"
              className="text-xs h-8 font-medium"
            />
            <p className="text-[11px] text-muted-foreground">
              This name will be displayed on the Home Page and Reports Directory.
            </p>
          </div>

          {/* 2. Reporting Date Range / Period */}
          <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Reporting Period / Month & Year
            </Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Month</span>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(val) => setSelectedMonth(parseInt(val, 10))}
                >
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Year</span>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(val) => setSelectedYear(parseInt(val, 10))}
                >
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50">
              <span>Selected Period:</span>
              <Badge variant="outline" className="font-mono text-[10px] text-primary font-bold">
                {selectedMonthObj.label} {selectedYear} ({selectedYear}-{String(selectedMonth).padStart(2, "0")})
              </Badge>
            </div>
          </div>

          {/* 3. Sheets Detected Preview */}
          {detection && detection.sheets && detection.sheets.length > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Sheets Detected in Workbook ({detection.sheets.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detection.sheets.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-background border border-border text-foreground"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Report Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Report Schema & Parser
            </Label>
            <RadioGroup
              value={selectedType}
              onValueChange={(val) => setSelectedType(val as ReportType)}
              className="space-y-2"
            >
              {REPORT_TYPE_OPTIONS.map((option) => {
                const isSelected = selectedType === option.id;
                const isSuggested = detection?.type === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => option.supported && setSelectedType(option.id)}
                    className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer ${
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
                      <div className="space-y-0.5">
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
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
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
            className="text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground font-semibold"
          >
            Ingest & Store in Database
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
