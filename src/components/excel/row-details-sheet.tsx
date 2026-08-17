"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RowDetailsContent } from "@/components/excel/row-details";
import { FlipkartColumnMapping } from "@/lib/flipkart-columns";
import { formatCellValue } from "@/lib/excel-utils";

interface RowDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  row: Record<string, unknown> | null;
  mapping: FlipkartColumnMapping;
  headers: string[];
}

export function RowDetailsSheet({
  isOpen,
  onClose,
  row,
  mapping,
  headers,
}: RowDetailsSheetProps) {
  if (!row) return null;

  const returnId = mapping.returnId ? formatCellValue(row[mapping.returnId]) : "Details";
  const productTitle = mapping.product ? formatCellValue(row[mapping.product]) : "";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-6xl w-full p-0 flex flex-col bg-background">
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Return Record
              </span>
            </div>
            <SheetTitle className="text-lg font-bold tracking-tight font-mono break-all">
              {returnId}
            </SheetTitle>
            {productTitle && (
              <SheetDescription className="text-xs text-muted-foreground line-clamp-2">
                {productTitle}
              </SheetDescription>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <RowDetailsContent row={row} mapping={mapping} headers={headers} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
