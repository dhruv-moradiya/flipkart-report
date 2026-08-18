"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSkuHistoricalPerformance,
} from "@/hooks/use-actual-profit";
import { FinancialBasis } from "@/types/profit-analytics.types";
import { ProfitBasisToggle } from "@/components/profit/profit-basis-toggle";
import { ProfitabilityBadge } from "@/components/profit/profitability-badge";
import { ProfitSummaryCard } from "@/components/profit/profit-summary-card";
import { ProfitDrilldownDialog } from "@/components/profit/profit-drilldown-dialog";
import { EditSkuCostModal } from "@/components/sku-costs/edit-sku-cost-modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Calculator,
  Edit3,
  Calendar,
  Layers,
  TrendingUp,
  Package,
  Boxes,
  Loader2,
  Clock,
  Table as TableIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function SkuActualProfitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sku = decodeURIComponent((params.skuId as string) || "");

  const [financialBasis, setFinancialBasis] = useState<FinancialBasis>("netEarnings");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState<boolean>(false);

  const { data, isLoading, refetch } = useSkuHistoricalPerformance(
    sku,
    financialBasis,
    "netUnits"
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs">Loading SKU historical profitability...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border border-border bg-card p-8 text-center space-y-4 max-w-md mx-auto mt-8">
        <CardTitle className="text-base font-bold">SKU Not Found</CardTitle>
        <p className="text-xs text-muted-foreground">
          No records found for SKU <code className="font-mono bg-muted px-1 rounded">{sku}</code>.
        </p>
        <Button asChild size="sm" variant="outline" className="text-xs">
          <Link href="/analytics/actual-profit">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Actual Profit Analytics
          </Link>
        </Button>
      </Card>
    );
  }

  const { currentCostProfile, costProfilesHistory, summary, monthlyHistory } = data;

  const handleOpenDrilldown = (snapshotId: string) => {
    setSelectedSnapshotId(snapshotId);
    setIsDrilldownOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link href="/analytics/actual-profit" title="Back to All SKUs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-mono text-foreground tracking-tight">
                {sku}
              </h1>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium truncate max-w-md">
                {data.productName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Historical monthly actual profit tracking and custom cost history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ProfitBasisToggle value={financialBasis} onChange={setFinancialBasis} />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 cursor-pointer bg-background"
          >
            <Link href={`/pnl?tab=skus&sku=${encodeURIComponent(sku)}`}>
              <TableIcon className="h-3.5 w-3.5 text-primary" />
              P&L Tables
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCostModalOpen(true)}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Costs
          </Button>
        </div>
      </div>

      {/* Grid: Current Cost Profile & Profit Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Current Cost Profile Card */}
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Current Cost Profile
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCostModalOpen(true)}
              className="h-6 px-2 text-[11px] cursor-pointer"
            >
              Edit
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between text-foreground">
              <span className="font-sans text-muted-foreground">Product Cost / Unit:</span>
              <span className="font-semibold">
                {currentCostProfile.productCostPerUnit !== null
                  ? `₹${currentCostProfile.productCostPerUnit}`
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between text-foreground">
              <span className="font-sans text-muted-foreground">Logistics / Unit:</span>
              <span className="font-semibold">
                {currentCostProfile.logisticsCostPerUnit !== null
                  ? `₹${currentCostProfile.logisticsCostPerUnit}`
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between text-foreground">
              <span className="font-sans text-muted-foreground">Packaging / Unit:</span>
              <span className="font-semibold">
                {currentCostProfile.packagingCostPerUnit !== null
                  ? `₹${currentCostProfile.packagingCostPerUnit}`
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between text-foreground">
              <span className="font-sans text-muted-foreground">Other / Unit:</span>
              <span className="font-semibold">
                {currentCostProfile.otherCostPerUnit !== null
                  ? `₹${currentCostProfile.otherCostPerUnit}`
                  : "Not set"}
              </span>
            </div>

            <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
              <span className="font-sans">Total Seller Cost / Unit:</span>
              <span className="text-primary">
                {currentCostProfile.totalSellerCostPerUnit !== null
                  ? `₹${currentCostProfile.totalSellerCostPerUnit}`
                  : "Incomplete"}
              </span>
            </div>

            {currentCostProfile.notes && (
              <div className="font-sans text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border">
                <strong>Notes:</strong> {currentCostProfile.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. All-Time Profit Summary Card */}
        <div className="lg:col-span-2">
          <ProfitSummaryCard
            financialAmount={summary.totalFinancialAmount}
            totalProductCost={summary.totalProductCost}
            totalLogisticsCost={summary.totalLogisticsCost}
            totalPackagingCost={summary.totalPackagingCost}
            totalOtherCost={summary.totalOtherCost}
            totalSellerCost={summary.totalSellerCost}
            actualProfit={summary.totalActualProfit}
            financialBasis={financialBasis}
            units={summary.totalUnits}
          />
        </div>
      </div>

      {/* Monthly Performance Table */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="py-3 px-4 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Monthly Historical Performance
            </CardTitle>
            <span className="text-[11px] text-muted-foreground font-mono">
              {monthlyHistory.length} uploaded reporting periods
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table className="text-xs">
            <TableHeader className="bg-muted/40 font-semibold">
              <TableRow>
                <TableHead className="py-2.5 pl-4">Month</TableHead>
                <TableHead className="py-2.5 text-center">Net Units</TableHead>
                <TableHead className="py-2.5 text-right">Flipkart Amount</TableHead>
                <TableHead className="py-2.5 text-right">Seller Costs</TableHead>
                <TableHead className="py-2.5 text-right">Actual Profit</TableHead>
                <TableHead className="py-2.5 text-right">Profit / Unit</TableHead>
                <TableHead className="py-2.5 text-right">Margin %</TableHead>
                <TableHead className="py-2.5 text-center">Status</TableHead>
                <TableHead className="py-2.5 pr-4 text-right">Drill-down</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    No historical monthly records found for this SKU.
                  </TableCell>
                </TableRow>
              ) : (
                monthlyHistory.map((h) => (
                  <TableRow key={h.snapshotId} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-2.5 pl-4 font-semibold text-foreground">
                      {h.periodLabel}
                    </TableCell>
                    <TableCell className="py-2.5 text-center font-mono">
                      {h.units.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-mono font-semibold">
                      ₹{h.financialAmount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                      {h.totalSellerCost !== null
                        ? `-₹${h.totalSellerCost.toLocaleString("en-IN")}`
                        : "Not Configured"}
                    </TableCell>
                    <TableCell
                      className={`py-2.5 text-right font-mono font-bold ${
                        h.actualProfit !== null
                          ? h.actualProfit >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {h.actualProfit !== null ? (
                        h.actualProfit >= 0 ? (
                          `₹${h.actualProfit.toLocaleString("en-IN")}`
                        ) : (
                          `-₹${Math.abs(h.actualProfit).toLocaleString("en-IN")}`
                        )
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-mono">
                      {h.profitPerUnit !== null ? `₹${h.profitPerUnit.toFixed(1)}` : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-mono font-medium">
                      {h.profitMargin !== null ? `${h.profitMargin.toFixed(1)}%` : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <ProfitabilityBadge status={h.profitabilityStatus} costStatus={h.costStatus} />
                    </TableCell>
                    <TableCell className="py-2.5 pr-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDrilldown(h.snapshotId)}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Calculator className="h-3 w-3 mr-1" />
                        Audit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Historical Trend Charts */}
      {monthlyHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Actual Profit by Month */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Actual Profit by Month
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-6">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [
                        val !== null ? `₹${Number(val).toLocaleString("en-IN")}` : "Missing",
                        "Actual Profit",
                      ]}
                    />
                    <Bar
                      dataKey="actualProfit"
                      name="Actual Profit"
                      fill="var(--chart-1, #10b981)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Net Units Sold by Month */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Net Units Sold by Month
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-6">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(val: any) => [`${val} units`, "Net Units"]} />
                    <Line
                      type="monotone"
                      dataKey="units"
                      name="Net Units"
                      stroke="var(--chart-2, #3b82f6)"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Drilldown Modal */}
      <ProfitDrilldownDialog
        snapshotId={selectedSnapshotId}
        open={isDrilldownOpen}
        onOpenChange={setIsDrilldownOpen}
      />

      {/* Edit Cost Modal */}
      <EditSkuCostModal
        sku={sku}
        productName={data.productName}
        initialCosts={{
          productCostPerUnit: currentCostProfile.productCostPerUnit,
          logisticsCostPerUnit: currentCostProfile.logisticsCostPerUnit,
          packagingCostPerUnit: currentCostProfile.packagingCostPerUnit,
          otherCostPerUnit: currentCostProfile.otherCostPerUnit,
          notes: currentCostProfile.notes,
        }}
        open={isCostModalOpen}
        onOpenChange={setIsCostModalOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
