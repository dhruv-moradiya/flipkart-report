"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useActualProfitOverview,
  useAvailablePeriods,
} from "@/hooks/use-actual-profit";
import { FinancialBasis, SkuProfitRow } from "@/types/profit-analytics.types";
import { ProfitBasisToggle } from "@/components/profit/profit-basis-toggle";
import { PeriodSelector } from "@/components/profit/period-selector";
import { ProfitabilityBadge } from "@/components/profit/profitability-badge";
import { ProfitDrilldownDialog } from "@/components/profit/profit-drilldown-dialog";
import { EditSkuCostModal } from "@/components/sku-costs/edit-sku-cost-modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Package,
  Boxes,
  Truck,
  Layers,
  ArrowUpDown,
  Search,
  HelpCircle,
  Calculator,
  ExternalLink,
  PlusCircle,
  Loader2,
  FileSpreadsheet,
  Table as TableIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type SortOption =
  | "profit-desc"
  | "profit-asc"
  | "margin-desc"
  | "margin-asc"
  | "cost-desc"
  | "units-desc";

export default function ActualProfitPage() {
  const [periodFilter, setPeriodFilter] = useState<string>("all-time");
  const [financialBasis, setFinancialBasis] = useState<FinancialBasis>("netEarnings");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("profit-desc");

  // Dialog states
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);

  const [editingSku, setEditingSku] = useState<{
    sku: string;
    productName?: string;
    costs?: any;
  } | null>(null);
  const [isCostModalOpen, setIsCostModalOpen] = useState<boolean>(false);

  const { data: availablePeriods = [] } = useAvailablePeriods();
  const { data, isLoading, refetch } = useActualProfitOverview(
    periodFilter,
    financialBasis,
    "netUnits"
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs">Computing actual profit analytics across reports...</p>
      </div>
    );
  }

  if (!data || data.periodsIncluded.length === 0) {
    return (
      <Card className="border border-border bg-card p-8 text-center space-y-4 max-w-xl mx-auto mt-8">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg font-bold">No Uploaded P&L Reports in Database</CardTitle>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Upload official monthly Flipkart Profit & Loss reports to enable persistent actual profit tracking and historical SKU profitability analytics.
        </p>
        <div className="pt-2">
          <Button asChild size="sm" className="text-xs gap-1.5 cursor-pointer">
            <Link href="/">
              <PlusCircle className="h-4 w-4" />
              Upload Monthly P&L Report
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const { totals, counts, monthlyTrend, skuTable } = data;

  // Filter & Sort SKU Table
  const filteredSkus = skuTable.filter((row: SkuProfitRow) => {
    const matchesSearch =
      row.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.productName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "PROFITABLE") return row.profitabilityStatus === "PROFITABLE";
    if (statusFilter === "LOSS") return row.profitabilityStatus === "LOSS";
    if (statusFilter === "BREAK_EVEN") return row.profitabilityStatus === "BREAK_EVEN";
    if (statusFilter === "MISSING_COST") return row.costStatus === "MISSING";
    if (statusFilter === "PARTIAL_COST") return row.costStatus === "PARTIAL";

    return true;
  });

  const sortedSkus = [...filteredSkus].sort((a, b) => {
    switch (sortBy) {
      case "profit-desc":
        return (b.actualProfit ?? -Infinity) - (a.actualProfit ?? -Infinity);
      case "profit-asc":
        return (a.actualProfit ?? Infinity) - (b.actualProfit ?? Infinity);
      case "margin-desc":
        return (b.profitMargin ?? -Infinity) - (a.profitMargin ?? -Infinity);
      case "margin-asc":
        return (a.profitMargin ?? Infinity) - (b.profitMargin ?? Infinity);
      case "cost-desc":
        return (b.totalSellerCost ?? -Infinity) - (a.totalSellerCost ?? -Infinity);
      case "units-desc":
        return b.units - a.units;
      default:
        return 0;
    }
  });

  const handleOpenDrilldown = (snapshotId?: string) => {
    if (snapshotId) {
      setSelectedSnapshotId(snapshotId);
      setIsDrilldownOpen(true);
    }
  };

  const handleEditCosts = (row: SkuProfitRow) => {
    setEditingSku({
      sku: row.sku,
      productName: row.productName,
      costs: {
        productCostPerUnit: row.costBreakdown.product,
        logisticsCostPerUnit: row.costBreakdown.logistics,
        packagingCostPerUnit: row.costBreakdown.packaging,
        otherCostPerUnit: row.costBreakdown.other,
      },
    });
    setIsCostModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Monthly Actual Profit Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Combines Flipkart financial P&L data with your custom unit costs for exact net earnings.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ProfitBasisToggle value={financialBasis} onChange={setFinancialBasis} />
          <PeriodSelector
            value={periodFilter}
            onChange={setPeriodFilter}
            availablePeriods={availablePeriods}
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Flipkart Financial Amount */}
        <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Flipkart Financial Base</span>
            <IndianRupee className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            ₹{totals.totalFinancialAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {totals.totalUnits.toLocaleString("en-IN")} Net Units across {counts.totalSkus} SKUs
          </div>
        </Card>

        {/* 2. Total Seller Costs */}
        <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Seller Costs</span>
            <Truck className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {totals.totalSellerCost !== null
              ? `-₹${totals.totalSellerCost.toLocaleString("en-IN")}`
              : "Incomplete Costs"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Product + Logistics + Packaging + Other
          </div>
        </Card>

        {/* 3. Actual Business Profit */}
        <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Actual Business Profit</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              totals.totalActualProfit !== null
                ? totals.totalActualProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground"
            }`}
          >
            {totals.totalActualProfit !== null
              ? totals.totalActualProfit >= 0
                ? `₹${totals.totalActualProfit.toLocaleString("en-IN")}`
                : `-₹${Math.abs(totals.totalActualProfit).toLocaleString("en-IN")}`
              : "Cost Config Required"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {totals.overallProfitMargin !== null
              ? `${totals.overallProfitMargin.toFixed(2)}% net profit margin`
              : "Pending complete costs"}
          </div>
        </Card>

        {/* 4. Profit Per Unit & SKU Counts */}
        <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Average Profit / Unit</span>
            <Boxes className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {totals.averageProfitPerUnit !== null
              ? `₹${totals.averageProfitPerUnit.toFixed(2)}`
              : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {counts.profitableSkus} Profitable
            </span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              {counts.lossSkus} Loss
            </span>
            {counts.missingCostSkus > 0 && (
              <>
                <span>•</span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold">
                  {counts.missingCostSkus} Needs Cost
                </span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Actual Profit Chart */}
      {monthlyTrend.length > 0 && (
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Historical Monthly Actual Profit vs Flipkart Revenue
              </CardTitle>
              <span className="text-[11px] text-muted-foreground font-mono">
                {monthlyTrend.length} uploaded report periods
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    formatter={(val: any, name: any) => [
                      val !== null ? `₹${Number(val).toLocaleString("en-IN")}` : "Missing Cost",
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar
                    dataKey="financialAmount"
                    name="Flipkart Financial Amount"
                    fill="var(--chart-2, #3b82f6)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="sellerCost"
                    name="Seller Unit Costs"
                    fill="var(--chart-5, #f43f5e)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="actualProfit"
                    name="Actual Business Profit"
                    fill="var(--chart-1, #10b981)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SKU Actual Profit Table */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 border-b border-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold">SKU Actual Profitability Rankings</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact net earnings calculated after deducting your custom product, logistics, packaging & other costs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 cursor-pointer">
                <Link href="/sku-costs">
                  <Layers className="h-3.5 w-3.5" />
                  Bulk Manage SKU Costs
                </Link>
              </Button>
            </div>
          </div>

          {/* Search, Filter & Sort Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search SKU or Product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs pl-8 font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs min-w-[130px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ALL">All Statuses ({skuTable.length})</SelectItem>
                  <SelectItem value="PROFITABLE">Profitable ({counts.profitableSkus})</SelectItem>
                  <SelectItem value="LOSS">Loss Making ({counts.lossSkus})</SelectItem>
                  <SelectItem value="BREAK_EVEN">Break Even ({counts.breakEvenSkus})</SelectItem>
                  <SelectItem value="MISSING_COST">Missing Cost ({counts.missingCostSkus})</SelectItem>
                  <SelectItem value="PARTIAL_COST">Incomplete Cost ({counts.partialCostSkus})</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
                <SelectTrigger className="h-8 text-xs min-w-[150px]">
                  <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="profit-desc">Highest Actual Profit</SelectItem>
                  <SelectItem value="profit-asc">Lowest Actual Profit</SelectItem>
                  <SelectItem value="margin-desc">Highest Profit Margin %</SelectItem>
                  <SelectItem value="margin-asc">Lowest Profit Margin %</SelectItem>
                  <SelectItem value="cost-desc">Highest Seller Cost</SelectItem>
                  <SelectItem value="units-desc">Most Net Units</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40 font-semibold">
                <TableRow>
                  <TableHead className="py-2.5 pl-4">SKU & Product</TableHead>
                  <TableHead className="py-2.5 text-center">Net Units</TableHead>
                  <TableHead className="py-2.5 text-right">Flipkart Amount</TableHead>
                  <TableHead className="py-2.5 text-right">Seller Costs</TableHead>
                  <TableHead className="py-2.5 text-right">Actual Profit</TableHead>
                  <TableHead className="py-2.5 text-right">Profit / Unit</TableHead>
                  <TableHead className="py-2.5 text-right">Margin %</TableHead>
                  <TableHead className="py-2.5 text-center">Status</TableHead>
                  <TableHead className="py-2.5 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSkus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No SKUs match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSkus.map((row) => (
                    <TableRow key={row.sku} className="hover:bg-muted/30 transition-colors">
                      {/* SKU & Product */}
                      <TableCell className="py-2.5 pl-4 max-w-[220px]">
                        <Link
                          href={`/sku/${encodeURIComponent(row.sku)}`}
                          className="font-mono font-bold text-foreground hover:text-primary hover:underline block truncate"
                        >
                          {row.sku}
                        </Link>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {row.productName}
                        </span>
                      </TableCell>

                      {/* Units */}
                      <TableCell className="py-2.5 text-center font-mono font-medium">
                        {row.units.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Flipkart Amount */}
                      <TableCell className="py-2.5 text-right font-mono font-semibold">
                        ₹{row.financialAmount.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Seller Costs */}
                      <TableCell className="py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                        {row.totalSellerCost !== null ? (
                          `-₹${row.totalSellerCost.toLocaleString("en-IN")}`
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditCosts(row)}
                            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            + Add Costs
                          </button>
                        )}
                      </TableCell>

                      {/* Actual Profit */}
                      <TableCell
                        className={`py-2.5 text-right font-mono font-bold ${
                          row.actualProfit !== null
                            ? row.actualProfit >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {row.actualProfit !== null ? (
                          row.actualProfit >= 0 ? (
                            `₹${row.actualProfit.toLocaleString("en-IN")}`
                          ) : (
                            `-₹${Math.abs(row.actualProfit).toLocaleString("en-IN")}`
                          )
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Profit / Unit */}
                      <TableCell className="py-2.5 text-right font-mono">
                        {row.profitPerUnit !== null ? (
                          `₹${row.profitPerUnit.toFixed(1)}`
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Profit Margin */}
                      <TableCell className="py-2.5 text-right font-mono font-medium">
                        {row.profitMargin !== null ? (
                          `${row.profitMargin.toFixed(1)}%`
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2.5 text-center">
                        <ProfitabilityBadge
                          status={row.profitabilityStatus}
                          costStatus={row.costStatus}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 text-[11px] text-muted-foreground hover:text-primary cursor-pointer"
                            title="View in P&L Tables"
                          >
                            <Link href={`/pnl?tab=skus&sku=${encodeURIComponent(row.sku)}`}>
                              <TableIcon className="h-3.5 w-3.5" />
                            </Link>
                          </Button>

                          {row.snapshotId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDrilldown(row.snapshotId)}
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Audit Breakdown"
                            >
                              <Calculator className="h-3 w-3 mr-1" />
                              Audit
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCosts(row)}
                            className="h-7 px-2 text-[11px] cursor-pointer"
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Drilldown Dialog */}
      <ProfitDrilldownDialog
        snapshotId={selectedSnapshotId}
        open={isDrilldownOpen}
        onOpenChange={setIsDrilldownOpen}
      />

      {/* Edit Cost Modal */}
      {editingSku && (
        <EditSkuCostModal
          sku={editingSku.sku}
          productName={editingSku.productName}
          initialCosts={editingSku.costs}
          open={isCostModalOpen}
          onOpenChange={setIsCostModalOpen}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
