"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  Tag,
  Clock,
  Sparkles,
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
import {
  ReportType,
  REPORT_TYPE_OPTIONS,
  ReportDetectionResult,
  ReportDateRange,
} from "../types/report.types";
import {
  detectReportDateRange,
  formatDateDisplay,
  getDateDifferenceInDays,
  buildReportDateRange,
  getMonthDateRange,
  getPresetDateRange,
  toISODateString,
} from "../utils/date-range.utils";

interface ReportDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  detection: ReportDetectionResult | null;
  onConfirm: (
    selectedType: ReportType,
    customReportName?: string,
    dateRange?: ReportDateRange,
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

const YEARS = [2023, 2024, 2025, 2026, 2027, 2028];

export function ReportDetectionDialog({
  isOpen,
  onClose,
  fileName,
  detection,
  onConfirm,
}: ReportDetectionDialogProps) {
  const [selectedType, setSelectedType] = useState<ReportType>("profit_loss");
  const [reportName, setReportName] = useState<string>(fileName);

  // Date Range State: Start Date & End Date (YYYY-MM-DD)
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  });

  const [autoDetectedInfo, setAutoDetectedInfo] = useState<{
    detected: boolean;
    reason?: string;
    initialRange?: ReportDateRange;
  }>({ detected: false });

  // Sync state when file / detection changes
  useEffect(() => {
    setReportName(fileName);

    if (detection?.type && detection.type !== "unknown") {
      setSelectedType(detection.type);
    }

    // Auto-detect date range from filename and Overall Summary metadata
    const ordersPeriod = detection?.overallSummary?.ordersReceivedPeriod;
    const detectedResult = detectReportDateRange(fileName, ordersPeriod);

    setStartDate(detectedResult.dateRange.startDate);
    setEndDate(detectedResult.dateRange.endDate);
    setAutoDetectedInfo({
      detected: detectedResult.detected,
      reason: detectedResult.reason,
      initialRange: detectedResult.dateRange,
    });
  }, [fileName, detection]);

  // Validation
  const isValidDateRange = Boolean(startDate && endDate && startDate <= endDate);
  const totalDays = startDate && endDate ? getDateDifferenceInDays(startDate, endDate) : 0;

  // Selected date range object
  const currentRange = buildReportDateRange(
    startDate,
    endDate,
    undefined,
    autoDetectedInfo.detected ? "auto_detected" : "user_selected"
  );

  const handlePresetSelect = (presetKey: "full_month" | "first_half" | "second_half" | "last_7_days" | "last_30_days" | "this_month") => {
    const currentStartYear = parseInt(startDate.split("-")[0], 10) || new Date().getFullYear();
    const currentStartMonth = parseInt(startDate.split("-")[1], 10) || new Date().getMonth() + 1;
    const preset = getPresetDateRange(presetKey, currentStartMonth, currentStartYear);
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
  };

  const handleMonthYearChange = (month: number, year: number) => {
    const range = getMonthDateRange(month, year);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const handleResetToDetected = () => {
    if (autoDetectedInfo.initialRange) {
      setStartDate(autoDetectedInfo.initialRange.startDate);
      setEndDate(autoDetectedInfo.initialRange.endDate);
    }
  };

  const handleContinue = () => {
    if (!isValidDateRange) return;

    onConfirm(
      selectedType,
      reportName.trim() || fileName,
      currentRange,
      currentRange.selectedMonth,
      currentRange.selectedYear
    );
  };

  const confidencePct = detection ? (detection.confidence * 100).toFixed(0) : "95";

  // Derive month & year for dropdowns
  const currentMonthNum = parseInt(startDate.split("-")[1], 10) || new Date().getMonth() + 1;
  const currentYearNum = parseInt(startDate.split("-")[0], 10) || new Date().getFullYear();

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
            Review the report title, select the exact start & end date range, and confirm the detected workbook schema before ingestion.
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
              placeholder="e.g. Aug 1 2026 To Aug 13 2026 P&L"
              className="text-xs h-8 font-medium"
            />
            <p className="text-[11px] text-muted-foreground">
              This name will be displayed on the Home Page and Reports Directory.
            </p>
          </div>

          {/* 2. Reporting Date Range (Start Date & End Date) */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Reporting Date Range (Start & End Date)
              </Label>
              {autoDetectedInfo.detected && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"
                >
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  Auto-Detected
                </Badge>
              )}
            </div>

            {/* Auto-detected notification banner if available */}
            {autoDetectedInfo.detected && autoDetectedInfo.reason && (
              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 text-primary">
                <span className="truncate pr-2">
                  ✨ {autoDetectedInfo.reason}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToDetected}
                  className="h-5 px-1.5 text-[10px] gap-1 hover:bg-primary/10 text-primary shrink-0 cursor-pointer"
                  title="Reset to detected date range"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reset
                </Button>
              </div>
            )}

            {/* Start Date & End Date Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Start Date</span>
                  <span className="font-mono text-primary font-normal">{formatDateDisplay(startDate)}</span>
                </span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs font-medium [color-scheme:dark]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>End Date</span>
                  <span className="font-mono text-primary font-normal">{formatDateDisplay(endDate)}</span>
                </span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs font-medium [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Quick Presets Pills */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">Quick Presets:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Or Month Jump:</span>
                  <Select
                    value={String(currentMonthNum)}
                    onValueChange={(val) => handleMonthYearChange(parseInt(val, 10), currentYearNum)}
                  >
                    <SelectTrigger className="h-6 w-24 text-[10px] font-medium py-0 px-2">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="text-xs max-h-48">
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(currentYearNum)}
                    onValueChange={(val) => handleMonthYearChange(currentMonthNum, parseInt(val, 10))}
                  >
                    <SelectTrigger className="h-6 w-18 text-[10px] font-medium py-0 px-2">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)} className="text-xs">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePresetSelect("full_month")}
                  className="h-6 text-[11px] px-2 py-0 bg-muted/60 hover:bg-muted font-normal cursor-pointer"
                >
                  Full Month
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePresetSelect("first_half")}
                  className="h-6 text-[11px] px-2 py-0 bg-muted/60 hover:bg-muted font-normal cursor-pointer"
                >
                  1st – 15th
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePresetSelect("second_half")}
                  className="h-6 text-[11px] px-2 py-0 bg-muted/60 hover:bg-muted font-normal cursor-pointer"
                >
                  16th – End
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePresetSelect("last_7_days")}
                  className="h-6 text-[11px] px-2 py-0 bg-muted/60 hover:bg-muted font-normal cursor-pointer"
                >
                  Last 7 Days
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePresetSelect("last_30_days")}
                  className="h-6 text-[11px] px-2 py-0 bg-muted/60 hover:bg-muted font-normal cursor-pointer"
                >
                  Last 30 Days
                </Button>
              </div>
            </div>

            {/* Selected Period Badge & Validation Status */}
            <div className="pt-2 flex items-center justify-between text-[11px] border-t border-border/50">
              {isValidDateRange ? (
                <>
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-primary" />
                    Selected Period:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[10px] text-primary font-bold">
                      {currentRange.periodLabel}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {totalDays} {totalDays === 1 ? "day" : "days"}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-destructive text-[11px] font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Start date must be on or before end date.</span>
                </div>
              )}
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
            disabled={!isValidDateRange}
            onClick={handleContinue}
            className="text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            Ingest & Store in Database
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
