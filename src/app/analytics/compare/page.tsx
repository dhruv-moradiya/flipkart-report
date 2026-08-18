"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  usePeriodComparison,
  useAvailablePeriods,
} from "@/hooks/use-actual-profit";
import { FinancialBasis, SkuPeriodComparison } from "@/types/profit-analytics.types";
import { ProfitBasisToggle } from "@/components/profit/profit-basis-toggle";
import { ProfitabilityBadge } from "@/components/profit/profitability-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowUpDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowLeft,
  Loader2,
  Calendar,
} from "lucide-react";

export default function PeriodComparisonPage() {
  const { data: availablePeriods = [] } = useAvailablePeriods();

  const defaultPeriodA = availablePeriods[availablePeriods.length - 1]?.reportingPeriod || "";
  const defaultPeriodB =
    availablePeriods.length >= 2
      ? availablePeriods[availablePeriods.length - 2]?.reportingPeriod
      : availablePeriods[0]?.reportingPeriod || "";

  const [periodA, setPeriodA] = useState<string>(defaultPeriodA);
  const [periodB, setPeriodB] = useState<string>(defaultPeriodB);
  const [financialBasis, setFinancialBasis] = useState<FinancialBasis>("netEarnings");

  // Sync defaults when availablePeriods loads
  React.useEffect(() => {
    if (!periodA && availablePeriods.length > 0) {
      setPeriodA(availablePeriods[availablePeriods.length - 1].reportingPeriod);
      if (availablePeriods.length >= 2) {
        setPeriodB(availablePeriods[availablePeriods.length - 2].reportingPeriod);
      } else {
        setPeriodB(availablePeriods[0].reportingPeriod);
      }
    }
  }, [availablePeriods, periodA]);

  const { data, isLoading } = usePeriodComparison(periodA, periodB, financialBasis, "netUnits");

  const renderDelta = (val: number | null, isCurrency = false, isPercent = false) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground">—</span>;

    const isPositive = val > 0;
    const isNegative = val < 0;

    let formatted = "";
    if (isCurrency) {
      formatted = `${isPositive ? "+" : "-"}₹${Math.abs(val).toLocaleString("en-IN")}`;
    } else if (isPercent) {
      formatted = `${isPositive ? "+" : ""}${val.toFixed(2)}%`;
    } else {
      formatted = `${isPositive ? "+" : ""}${val.toLocaleString("en-IN")}`;
    }

    return (
      <span
        className={`font-mono font-semibold ${
          isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : isNegative
            ? "text-rose-600 dark:text-rose-400"
            : "text-muted-foreground"
        }`}
      >
        {formatted}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link href="/analytics/actual-profit" title="Back to Actual Profit">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              Reporting Period Profitability Comparison
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare profit, seller costs, payouts & units sold between two monthly P&L reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ProfitBasisToggle value={financialBasis} onChange={setFinancialBasis} />
        </div>
      </div>

      {/* Period Selection Bar */}
      <Card className="border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Target Period A */}
            <div className="space-y-1 w-full sm:w-48">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Target Period (Period A)
              </label>
              <Select value={periodA} onValueChange={setPeriodA}>
                <SelectTrigger className="h-8 text-xs font-semibold">
                  <SelectValue placeholder="Select Period A" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {availablePeriods.map((p) => (
                    <SelectItem key={p.reportingPeriod} value={p.reportingPeriod}>
                      {p.periodLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
            </div>

            {/* Baseline Period B */}
            <div className="space-y-1 w-full sm:w-48">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Comparison Baseline (Period B)
              </label>
              <Select value={periodB} onValueChange={setPeriodB}>
                <SelectTrigger className="h-8 text-xs font-semibold">
                  <SelectValue placeholder="Select Period B" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {availablePeriods.map((p) => (
                    <SelectItem key={p.reportingPeriod} value={p.reportingPeriod}>
                      {p.periodLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Comparing <strong className="text-foreground">{periodA}</strong> vs{" "}
            <strong className="text-foreground">{periodB}</strong>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs">Computing month-over-month profit differences...</span>
        </div>
      ) : !data ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Select two periods above to view comparison analytics.
        </div>
      ) : (
        <>
          {/* Aggregate Delta Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Actual Profit Change */}
            <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Actual Profit Change
              </span>
              <div className="text-xl font-bold font-mono">
                {renderDelta(data.aggregate.changes.profitChange, true)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {data.aggregate.changes.profitChangePct !== null ? (
                  <>
                    {renderDelta(data.aggregate.changes.profitChangePct, false, true)} vs baseline
                  </>
                ) : (
                  "Baseline N/A"
                )}
              </div>
            </Card>

            {/* 2. Flipkart Payout Change */}
            <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Flipkart Amount Change
              </span>
              <div className="text-xl font-bold font-mono">
                {renderDelta(data.aggregate.changes.payoutChange, true)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {data.aggregate.changes.payoutChangePct !== null ? (
                  <>
                    {renderDelta(data.aggregate.changes.payoutChangePct, false, true)} vs baseline
                  </>
                ) : (
                  "Baseline N/A"
                )}
              </div>
            </Card>

            {/* 3. Seller Cost Change */}
            <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Seller Cost Change
              </span>
              <div className="text-xl font-bold font-mono">
                {renderDelta(data.aggregate.changes.costChange, true)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {data.aggregate.changes.costChangePct !== null ? (
                  <>
                    {renderDelta(data.aggregate.changes.costChangePct, false, true)} vs baseline
                  </>
                ) : (
                  "Baseline N/A"
                )}
              </div>
            </Card>

            {/* 4. Units Sold Change */}
            <Card className="border border-border bg-card p-4 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Net Units Change
              </span>
              <div className="text-xl font-bold font-mono">
                {renderDelta(data.aggregate.changes.unitsChange, false)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {data.aggregate.changes.unitsChangePct !== null ? (
                  <>
                    {renderDelta(data.aggregate.changes.unitsChangePct, false, true)} vs baseline
                  </>
                ) : (
                  "Baseline N/A"
                )}
              </div>
            </Card>
          </div>

          {/* SKU Comparison Table */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-bold">SKU Performance Comparison Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/40 font-semibold">
                    <TableRow>
                      <TableHead className="py-2.5 pl-4">SKU</TableHead>
                      <TableHead className="py-2.5 text-right">{periodA} Units</TableHead>
                      <TableHead className="py-2.5 text-right">{periodB} Units</TableHead>
                      <TableHead className="py-2.5 text-right">Units Δ</TableHead>
                      <TableHead className="py-2.5 text-right">{periodA} Profit</TableHead>
                      <TableHead className="py-2.5 text-right">{periodB} Profit</TableHead>
                      <TableHead className="py-2.5 text-right">Actual Profit Δ</TableHead>
                      <TableHead className="py-2.5 pr-4 text-right">Margin Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.skuComparisons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          No SKU records found in both periods.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.skuComparisons.map((c: SkuPeriodComparison) => (
                        <TableRow key={c.sku} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-2.5 pl-4 font-mono font-bold">
                            <Link
                              href={`/sku/${encodeURIComponent(c.sku)}`}
                              className="hover:text-primary hover:underline"
                            >
                              {c.sku}
                            </Link>
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono">
                            {c.periodA.units}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono text-muted-foreground">
                            {c.periodB.units}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            {renderDelta(c.changes.unitsChange)}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono font-semibold">
                            {c.periodA.actualProfit !== null
                              ? `₹${c.periodA.actualProfit.toLocaleString("en-IN")}`
                              : "—"}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono text-muted-foreground">
                            {c.periodB.actualProfit !== null
                              ? `₹${c.periodB.actualProfit.toLocaleString("en-IN")}`
                              : "—"}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            {renderDelta(c.changes.profitChange, true)}
                          </TableCell>
                          <TableCell className="py-2.5 pr-4 text-right font-mono">
                            {renderDelta(c.changes.marginChange, false, true)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
