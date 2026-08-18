"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { PnlReportImportItem } from "@/types/sku-cost.types";

interface DeleteReportDialogProps {
  report: PnlReportImportItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteReportDialog({
  report,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteReportDialogProps) {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <DialogTitle className="text-base font-bold">
              Delete P&L Report Import
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1.5">
            Are you sure you want to delete <strong className="text-foreground">{report.fileName}</strong> (
            {report.periodLabel})?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 text-xs text-muted-foreground space-y-2">
          <p className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 p-2.5 rounded-lg leading-relaxed">
            <strong>Warning:</strong> Deleting this report will remove all normalized financial order and SKU rows ({report.skuCount} SKUs, {report.orderCount} Orders) and affect historical profit analytics and comparisons.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-xs gap-1.5 cursor-pointer"
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
