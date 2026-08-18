"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, RefreshCw, X, ArrowRight } from "lucide-react";

interface DuplicateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  detectedPeriod: {
    reportingPeriod: string;
    periodLabel: string;
  };
  onCancel: () => void;
  onReplace: () => void;
  onProceedWithPeriod: (period: string) => void;
}

export function DuplicateReportDialog({
  open,
  onOpenChange,
  fileName,
  detectedPeriod,
  onCancel,
  onReplace,
  onProceedWithPeriod,
}: DuplicateReportDialogProps) {
  const [customPeriod, setCustomPeriod] = useState(detectedPeriod.reportingPeriod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <DialogTitle className="text-base font-bold">
              Duplicate Report Detected
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1.5">
            A P&L report for period <strong className="text-foreground">{detectedPeriod.periodLabel}</strong> (
            <code className="text-[11px] bg-muted px-1 py-0.5 rounded">{fileName}</code>) has already been imported into the database.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            To prevent double-counting historical profit, please select how you would like to proceed:
          </p>

          <div className="space-y-2 border border-border p-3 rounded-lg bg-muted/20">
            <Label htmlFor="customPeriod" className="text-xs font-semibold">
              Or assign to a different reporting month:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="customPeriod"
                type="month"
                value={customPeriod}
                onChange={(e) => setCustomPeriod(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onProceedWithPeriod(customPeriod)}
                disabled={!customPeriod}
                className="h-8 text-xs shrink-0 cursor-pointer"
              >
                Use Month <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancel Import
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onReplace}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Replace Existing Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
