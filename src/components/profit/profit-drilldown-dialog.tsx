"use client";

import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSnapshotDrilldown } from "@/hooks/use-actual-profit";
import { ProfitabilityBadge } from "./profitability-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calculator,
  Layers,
  ShoppingCart,
  Loader2,
  Table as TableIcon,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProfitDrilldownDialogProps {
  snapshotId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfitDrilldownDialog({
  snapshotId,
  open,
  onOpenChange,
}: ProfitDrilldownDialogProps) {
  const { data, isLoading } = useSnapshotDrilldown(open ? snapshotId : null);

  const primaryReportId = data?.imports?.[0]?._id || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-bold">
                Profit Calculation Breakdown & Audit
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Exact mathematical breakdown and source records for this period.
              </DialogDescription>
            </div>
            {data?.snapshot && (
              <ProfitabilityBadge
                status={data.snapshot.profitabilityStatus}
                costStatus={data.snapshot.costStatus}
              />
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">Loading audit snapshot...</span>
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No snapshot data available.
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Header info & Quick P&L link */}
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/40 border border-border">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    SKU
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {data.snapshot.sku}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    Period
                  </span>
                  <span className="font-semibold">{data.snapshot.periodLabel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    Financial Basis
                  </span>
                  <span className="font-semibold text-primary">
                    {data.explanation.financialBasis}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                    Units Used
                  </span>
                  <span className="font-semibold">
                    {data.snapshot.applicableUnits} Net Units
                  </span>
                </div>
              </div>

              {primaryReportId && (
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    View raw Flipkart SKU metrics and individual orders:
                  </span>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 cursor-pointer bg-background"
                  >
                    <Link
                      href={`/pnl/${primaryReportId}?tab=skus&sku=${encodeURIComponent(
                        data.snapshot.sku
                      )}`}
                    >
                      <TableIcon className="h-3.5 w-3.5 text-primary" />
                      View SKU in P&L Tables
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Math Breakdown Box */}
            <Card className="border border-border p-4 bg-card shadow-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground pb-2 border-b border-border">
                <Calculator className="h-4 w-4 text-primary" />
                <span>Financial Math Formula</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-foreground">
                  <span className="font-sans text-muted-foreground">
                    Flipkart Financial Amount:
                  </span>
                  <span className="font-bold">
                    ₹{data.snapshot.financialAmount?.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span className="font-sans text-muted-foreground">
                    Seller Product Cost:
                  </span>
                  <span>
                    {data.snapshot.productCostPerUnit !== null
                      ? `- ₹${data.snapshot.totalProductCost?.toLocaleString(
                          "en-IN"
                        )} (${data.snapshot.applicableUnits} × ₹${
                          data.snapshot.productCostPerUnit
                        })`
                      : "Not Configured"}
                  </span>
                </div>

                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span className="font-sans text-muted-foreground">
                    Seller Logistics Cost:
                  </span>
                  <span>
                    {data.snapshot.logisticsCostPerUnit !== null
                      ? `- ₹${data.snapshot.totalLogisticsCost?.toLocaleString(
                          "en-IN"
                        )} (${data.snapshot.applicableUnits} × ₹${
                          data.snapshot.logisticsCostPerUnit
                        })`
                      : "Not Configured"}
                  </span>
                </div>

                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span className="font-sans text-muted-foreground">
                    Packaging Cost:
                  </span>
                  <span>
                    {data.snapshot.packagingCostPerUnit !== null
                      ? `- ₹${data.snapshot.totalPackagingCost?.toLocaleString(
                          "en-IN"
                        )} (${data.snapshot.applicableUnits} × ₹${
                          data.snapshot.packagingCostPerUnit
                        })`
                      : "Not Configured"}
                  </span>
                </div>

                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span className="font-sans text-muted-foreground">
                    Other Custom Cost:
                  </span>
                  <span>
                    {data.snapshot.otherCostPerUnit !== null
                      ? `- ₹${data.snapshot.totalOtherCost?.toLocaleString(
                          "en-IN"
                        )} (${data.snapshot.applicableUnits} × ₹${
                          data.snapshot.otherCostPerUnit
                        })`
                      : "Not Configured"}
                  </span>
                </div>

                <div className="flex justify-between text-foreground border-t border-border pt-1.5 font-bold">
                  <span className="font-sans text-muted-foreground">
                    Total Seller Costs:
                  </span>
                  <span>
                    {data.snapshot.totalSellerCost !== null
                      ? `₹${data.snapshot.totalSellerCost?.toLocaleString("en-IN")}`
                      : "Incomplete"}
                  </span>
                </div>

                <div className="flex justify-between border-t-2 border-border pt-2 text-sm font-bold">
                  <span className="font-sans">Actual Business Profit:</span>
                  <span
                    className={
                      (data.snapshot.actualProfit ?? 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {data.snapshot.actualProfit !== null
                      ? `₹${data.snapshot.actualProfit?.toLocaleString("en-IN")}`
                      : "Cannot Calculate (Cost Missing)"}
                  </span>
                </div>
              </div>
            </Card>

            {/* P&L Report Imports Source with Redirection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                <span>Source P&L Imports Used</span>
              </div>
              <div className="space-y-1.5">
                {data.imports && data.imports.length > 0 ? (
                  data.imports.map((imp: any) => (
                    <div
                      key={imp._id}
                      className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-foreground block truncate">
                          {imp.fileName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Period: {imp.periodLabel} • Uploaded:{" "}
                          {new Date(imp.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                          {imp.skuCount} SKUs / {imp.orderCount} Orders
                        </span>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1 cursor-pointer bg-background"
                        >
                          <Link
                            href={`/pnl/${imp._id}?tab=skus&sku=${encodeURIComponent(
                              data.snapshot.sku
                            )}`}
                          >
                            <TableIcon className="h-3 w-3 text-primary" />
                            Open Report
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Direct normalized report link.
                  </span>
                )}
              </div>
            </div>

            {/* Sample Orders for this SKU with clickable Order Redirection */}
            {data.sampleOrders && data.sampleOrders.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <span>Sample Normalized Orders ({data.sampleOrders.length})</span>
                  </div>
                  {primaryReportId && (
                    <Link
                      href={`/pnl/${primaryReportId}?tab=skus&sku=${encodeURIComponent(
                        data.snapshot.sku
                      )}`}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      View All Orders in P&L
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                  <Table className="text-[11px]">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="py-1.5">Order ID (Click to View)</TableHead>
                        <TableHead className="py-1.5">Status</TableHead>
                        <TableHead className="py-1.5">Net Units</TableHead>
                        <TableHead className="py-1.5 text-right">Net Earnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sampleOrders.slice(0, 15).map((o: any) => {
                        const targetReportId = o.reportImportId || primaryReportId;
                        const orderLink = `/pnl/${targetReportId}?tab=skus&sku=${encodeURIComponent(
                          data.snapshot.sku
                        )}&orderId=${encodeURIComponent(o.orderId)}`;

                        return (
                          <TableRow key={o._id || o.orderItemId}>
                            <TableCell className="font-mono py-1">
                              <Link
                                href={orderLink}
                                className="text-primary hover:underline font-semibold flex items-center gap-1"
                                title="Open order journey in P&L report"
                              >
                                {o.orderId}
                                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                              </Link>
                            </TableCell>
                            <TableCell className="py-1">
                              {o.orderStatus || "Delivered"}
                            </TableCell>
                            <TableCell className="py-1">{o.netUnits}</TableCell>
                            <TableCell className="py-1 text-right font-mono font-semibold">
                              ₹{o.netEarnings?.toLocaleString("en-IN")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
