"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExcelData } from "@/context/excel-context";
import { useAvailablePeriods } from "@/hooks/use-actual-profit";
import {
  ArrowLeft,
  Calculator,
  FileSpreadsheet,
  Sparkles,
  Table as TableIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ANALYTICS_NAV_ITEMS } from "./analytics-sidebar";

export function AnalyticsHeader() {
  const pathname = usePathname();
  const {
    uploadedReportsState,
    pnlReport,
    records,
    activeReportingPeriod,
    loadReportFromBackend,
  } = useExcelData();
  const { data: availablePeriods = [] } = useAvailablePeriods();

  const currentNav =
    ANALYTICS_NAV_ITEMS.find((n) => n.href === pathname) ||
    ANALYTICS_NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 shadow-2xs">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Section: Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
          >
            <Link href="/" title="Return to Upload & Home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                {currentNav.title}
              </h1>
              {uploadedReportsState.bothActive ? (
                <Badge
                  variant="default"
                  className="text-[10px] px-1.5 py-0 h-4 gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Dual Datasets
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 font-mono"
                >
                  {uploadedReportsState.pnlActive
                    ? "P&L Active"
                    : "Returns Active"}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              {currentNav.description}
            </p>
          </div>
        </div>

        {/* Right Section: Period Switcher & Action Hub */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Route Switches */}
          <Button
            asChild
            variant={
              pathname === "/analytics/actual-profit" ? "default" : "outline"
            }
            size="sm"
            className={`h-7 text-xs gap-1.5 cursor-pointer ${
              pathname === "/analytics/actual-profit"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-background"
            }`}
          >
            <Link href="/analytics/actual-profit">
              <Calculator className="h-3.5 w-3.5" />
              Actual Profit
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 bg-background cursor-pointer"
          >
            <Link href="/pnl">
              <TableIcon className="h-3.5 w-3.5" />
              P&L Tables
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link href="/">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
