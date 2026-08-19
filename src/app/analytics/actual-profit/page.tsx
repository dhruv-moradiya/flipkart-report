"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useActualProfitOverview,
  useAvailablePeriods,
} from "@/hooks/use-actual-profit";
import { useReportImports } from "@/hooks/use-report-imports";
import { FinancialBasis, SkuProfitRow } from "@/types/profit-analytics.types";
import { ProfitBasisToggle } from "@/components/profit/profit-basis-toggle";
import { PeriodSelector } from "@/components/profit/period-selector";
import { ProfitabilityBadge } from "@/components/profit/profitability-badge";
import { ProfitDrilldownDialog } from "@/components/profit/profit-drilldown-dialog";
import { EditSkuCostModal } from "@/components/sku-costs/edit-sku-cost-modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Sparkles,
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

function ActualProfitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: allReports = [] } = useReportImports();
  const { data: availablePeriods = [] } = useAvailablePeriods();

  // Filter only P&L reports (exclude returns and settlement-only ledgers)
  const pnlReports = useMemo(() => {
    return allReports.filter(
      (r) =>
        r.reportType === "FLIPKART_PNL" ||
        (!r.fileName.toLowerCase().includes("return") &&
          !r.fileName.toLowerCase().includes("settled") &&
          (r.skuCount ?? 0) > 0)
    );
  }, [allReports]);

  // Read URL query parameter: reportId, report_id, or periodFilter
  const queryReportId = searchParams.get("reportId") || searchParams.get("report_id");
  const queryPeriodFilter = searchParams.get("periodFilter");
  const activeParam = queryReportId || queryPeriodFilter || "";

  // By default, latest uploaded P&L report will be selected
  const [periodFilter, setPeriodFilter] = useState<string>(() => {
    if (activeParam) return activeParam;
    if (pnlReports.length > 0) return pnlReports[0]._id;
    return "all-time";
  });

  const [financialBasis, setFinancialBasis] = useState<FinancialBasis>("netEarnings");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("profit-desc");

  // Sync state with URL or default to latest uploaded P&L report
  useEffect(() => {
    if (activeParam) {
      setPeriodFilter(activeParam);
    } else if (pnlReports.length > 0) {
      // Default to latest uploaded P&L report
      const latestId = pnlReports[0]._id;
      setPeriodFilter(latestId);
      router.replace(`/analytics/actual-profit?reportId=${latestId}`);
    }
  }, [activeParam, pnlReports, router]);

  const handlePeriodChange = (newVal: string) => {
    setPeriodFilter(newVal);
    if (newVal.match(/^[0-9a-fA-F]{24}$/)) {
      router.replace(`/analytics/actual-profit?reportId=${newVal}`);
    } else {
      router.replace(`/analytics/actual-profit?periodFilter=${newVal}`);
    }
  };

  // Dialog states
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);

  const [editingSku, setEditingSku] = useState<{
    sku: string;
    productName?: string;
    costs?: any;
  } | null>(null);
  const [isCostModalOpen, setIsCostModalOpen] = useState<boolean>(false);

  const { data, isLoading, refetch } = useActualProfitOverview(
    periodFilter,
    financialBasis,
    "netUnits"
  );

  // Find currently active report metadata if an ID is selected
  const activeReport = useMemo(() => {
    return pnlReports.find(
      (r) => r._id === periodFilter || r.reportingPeriod === periodFilter
    );
  }, [pnlReports, periodFilter]);

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

  filteredSkus.sort((a: SkuProfitRow, b: SkuProfitRow) => {
    if (sortBy === "profit-desc") return (b.actualProfit ?? -Infinity) - (a.actualProfit ?? -Infinity);
    if (sortBy === "profit-asc") return (a.actualProfit ?? Infinity) - (b.actualProfit ?? Infinity);
    if (sortBy === "margin-desc") return (b.profitMargin ?? -Infinity) - (a.profitMargin ?? -Infinity);
    if (sortBy === "margin-asc") return (a.profitMargin ?? Infinity) - (b.profitMargin ?? Infinity);
    if (sortBy === "cost-desc") return (b.totalSellerCost ?? -Infinity) - (a.totalSellerCost ?? -Infinity);
    if (sortBy === "units-desc") return b.units - a.units;
    return 0;
  });

  const handleOpenDrilldown = (snapshotId: string) => {
    setSelectedSnapshotId(snapshotId);
    setIsDrilldownOpen(true);
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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-500" />
              Monthly Actual Profit Intelligence
            </h2>
            {activeReport && (
              <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                {activeReport.periodLabel}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Combines Flipkart financial P&L data with your custom unit costs for exact net earnings.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ProfitBasisToggle value={financialBasis} onChange={setFinancialBasis} />
          <PeriodSelector
            value={periodFilter}
            onChange={handlePeriodChange}
            availablePeriods={availablePeriods}
            reports={pnlReports}
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
          <div className="text-xl font-bold font-mono text-foreground">
            {totals.totalSellerCost !== null ? (
              `₹${totals.totalSellerCost.toLocaleString("en-IN")}`
            ) : (
              <span className="text-amber-500 text-sm font-sans font-medium flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                Costs Missing ({counts.missingCostSkus} SKUs)
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Product + Logistics + Packaging + Other
          </div>
        </Card>

        {/* 3. Actual Profit */}
        <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Actual Net Profit</span>
            {totals.totalActualProfit !== null && totals.totalActualProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            )}
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              totals.totalActualProfit !== null
                ? totals.totalActualProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground text-sm font-sans font-medium"
            }`}
          >
            {totals.totalActualProfit !== null ? (
              totals.totalActualProfit >= 0 ? (
                `+₹${totals.totalActualProfit.toLocaleString("en-IN")}`
              ) : (
                `-₹${Math.abs(totals.totalActualProfit).toLocaleString("en-IN")}`
              )
            ) : (
              "Complete costs to see"
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {totals.averageProfitPerUnit !== null
              ? `Avg ₹${totals.averageProfitPerUnit.toFixed(1)}/unit`
              : "Financial base minus all seller costs"}
          </div>
        </Card>

        {/* 4. Profit Margin */}
        <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Overall Profit Margin</span>
            <Layers className="h-4 w-4 text-blue-500" />
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              totals.overallProfitMargin !== null
                ? totals.overallProfitMargin >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground text-sm font-sans font-medium"
            }`}
          >
            {totals.overallProfitMargin !== null ? `${totals.overallProfitMargin.toFixed(1)}%` : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {counts.profitableSkus} Profitable • {counts.lossSkus} In Loss
          </div>
        </Card>
      </div>

      {/* Monthly Trend Chart (Multi-period only) */}
      {monthlyTrend.length > 1 && (
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="text-sm font-bold">Historical Monthly Profit & Cost Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="financialAmount" name="Flipkart Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sellerCost" name="Seller Costs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualProfit" name="Actual Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SKU Actual Profit Breakdown Table */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 border-b border-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold">
                SKU Actual Profitability Breakdown ({filteredSkus.length} SKUs)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exact profitability per SKU calculated from unit costs and Flipkart payouts.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search SKU or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Table Filters & Sorting Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Status:</span>
              {[
                { key: "ALL", label: `All (${skuTable.length})` },
                { key: "PROFITABLE", label: `Profitable (${counts.profitableSkus})` },
                { key: "LOSS", label: `Loss (${counts.lossSkus})` },
                { key: "MISSING_COST", label: `Missing Cost (${counts.missingCostSkus})` },
              ].map((s) => (
                <Button
                  key={s.key}
                  variant={statusFilter === s.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s.key)}
                  className="h-6 px-2 text-[11px] font-mono cursor-pointer"
                >
                  {s.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger className="h-7 text-xs w-[160px] bg-background">
                  <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="profit-desc">Highest Profit</SelectItem>
                  <SelectItem value="profit-asc">Lowest / High Loss</SelectItem>
                  <SelectItem value="margin-desc">Highest Margin (%)</SelectItem>
                  <SelectItem value="margin-asc">Lowest Margin (%)</SelectItem>
                  <SelectItem value="units-desc">Most Units Sold</SelectItem>
                  <SelectItem value="cost-desc">Highest Seller Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table className="text-xs w-full min-w-[950px]">
              <TableHeader className="bg-muted/40 font-semibold border-b border-border">
                <TableRow>
                  <TableHead className="py-2.5 pl-4 min-w-[180px]">SKU & Product</TableHead>
                  <TableHead className="py-2.5 text-center w-[80px]">Units</TableHead>
                  <TableHead className="py-2.5 text-right w-[110px]">Flipkart Base</TableHead>
                  <TableHead className="py-2.5 text-right w-[110px]">Seller Costs</TableHead>
                  <TableHead className="py-2.5 text-right w-[120px]">Actual Profit</TableHead>
                  <TableHead className="py-2.5 text-right w-[90px]">Profit/Unit</TableHead>
                  <TableHead className="py-2.5 text-right w-[90px]">Margin (%)</TableHead>
                  <TableHead className="py-2.5 text-center w-[120px]">Status</TableHead>
                  <TableHead className="py-2.5 pr-4 text-right w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSkus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No SKU records match the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSkus.map((row: SkuProfitRow) => (
                    <TableRow
                      key={row.sku}
                      className="hover:bg-muted/30 transition-colors border-b border-border/60"
                    >
                      {/* SKU & Product */}
                      <TableCell className="py-2.5 pl-4 font-bold text-foreground">
                        <div className="space-y-0.5">
                          <span className="block truncate max-w-[200px]" title={row.sku}>
                            {row.sku}
                          </span>
                          <span
                            className="text-[10px] text-muted-foreground font-normal block truncate max-w-[220px]"
                            title={row.productName}
                          >
                            {row.productName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Units */}
                      <TableCell className="py-2.5 text-center font-mono font-medium">
                        {row.units.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Financial Base */}
                      <TableCell className="py-2.5 text-right font-mono font-semibold text-foreground">
                        ₹{row.financialAmount.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Total Seller Costs */}
                      <TableCell className="py-2.5 text-right font-mono text-muted-foreground">
                        {row.totalSellerCost !== null ? (
                          `₹${row.totalSellerCost.toLocaleString("en-IN")}`
                        ) : (
                          <span className="text-amber-500 font-sans text-[10px] font-medium">
                            Cost Missing
                          </span>
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
                              onClick={() => handleOpenDrilldown(row.snapshotId!)}
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

export default function ActualProfitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs">Loading Actual Profit Intelligence...</p>
        </div>
      }
    >
      <ActualProfitContent />
    </Suspense>
  );
}
