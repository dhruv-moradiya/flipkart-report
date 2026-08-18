"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  ArrowUpDown,
  Layers,
  Package,
  ShoppingBag,
  RotateCcw,
  IndianRupee,
  Receipt,
  CreditCard,
  Sparkles,
  FileSpreadsheet,
  Settings,
  Table as TableIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useExcelData } from "@/context/excel-context";

export interface NavSection {
  title: string;
  items: {
    title: string;
    href: string;
    icon: any;
    description: string;
    badge?: string;
    requiresPnl?: boolean;
    requiresReturns?: boolean;
    requiresBoth?: boolean;
  }[];
}

export const ANALYTICS_NAV_SECTIONS: NavSection[] = [
  {
    title: "Profit Intelligence",
    items: [
      {
        title: "Actual Profit",
        href: "/analytics/actual-profit",
        icon: Calculator,
        description: "Net profit after custom seller unit costs",
        badge: "Core",
      },
      {
        title: "Period Compare",
        href: "/analytics/compare",
        icon: ArrowUpDown,
        description: "Month-over-month actual profit comparison",
      },
      {
        title: "SKU Cost Master",
        href: "/sku-costs",
        icon: Settings,
        description: "Manage product, logistics & packaging costs",
      },
      {
        title: "Report Archive",
        href: "/reports",
        icon: FileSpreadsheet,
        description: "Persistent uploaded monthly P&L imports",
      },
    ],
  },
  {
    title: "Flipkart Financials",
    items: [
      {
        title: "Overview",
        href: "/analytics/overview",
        icon: LayoutDashboard,
        description: "Business KPIs & high-level summaries",
      },
      {
        title: "SKU Performance",
        href: "/analytics/sku",
        icon: Layers,
        description: "Top earnings, sales, rates & EPU",
      },
      {
        title: "Products",
        href: "/analytics/products",
        icon: Package,
        description: "Product sales, units, RVP & RTO",
      },
      {
        title: "Orders",
        href: "/analytics/orders",
        icon: ShoppingBag,
        description: "Order status, fulfillment & channel",
      },
      {
        title: "Financial Waterfall",
        href: "/analytics/financials",
        icon: IndianRupee,
        description: "Revenue waterfall & settlement balance",
        requiresPnl: true,
      },
      {
        title: "Fees & Expenses",
        href: "/analytics/fees",
        icon: Receipt,
        description: "20 fee breakups & SKU tax split",
        requiresPnl: true,
      },
      {
        title: "Settlements",
        href: "/analytics/settlements",
        icon: CreditCard,
        description: "Projected vs settled & payouts",
        requiresPnl: true,
      },
    ],
  },
  {
    title: "Returns & Deep Dive",
    items: [
      {
        title: "Returns Deep Dive",
        href: "/analytics/returns",
        icon: RotateCcw,
        description: "Reasons, sub-reasons & conditions",
        requiresReturns: true,
      },
      {
        title: "Cross-Report Scatters",
        href: "/analytics/cross-report",
        icon: Sparkles,
        description: "Correlation scatters & return rates",
        requiresBoth: true,
      },
    ],
  },
  {
    title: "Data Tables",
    items: [
      {
        title: "P&L Tables",
        href: "/pnl",
        icon: TableIcon,
        description: "Interactive SKU & Order P&L data",
        requiresPnl: true,
      },
      {
        title: "Returns Table",
        href: "/table",
        icon: ShoppingBag,
        description: "Raw returns records table",
        requiresReturns: true,
      },
    ],
  },
];

export const ANALYTICS_NAV_ITEMS = ANALYTICS_NAV_SECTIONS.flatMap((s) => s.items);

export function AnalyticsSidebar() {
  const pathname = usePathname();
  const { uploadedReportsState } = useExcelData();

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Mobile Horizontal Navigation Pills */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {ANALYTICS_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Desktop Sticky Sidebar Menu */}
      <nav className="hidden lg:block lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto custom-scrollbar rounded-xl border border-border bg-card p-3 space-y-4 shadow-xs">
        {ANALYTICS_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </div>

            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>

                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className={`text-[9px] px-1.5 py-0 h-4 font-semibold ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground border-transparent"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}

                  {item.requiresBoth && !uploadedReportsState.bothActive && (
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 h-3.5 ${
                        isActive
                          ? "border-primary-foreground/40 text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      Dual
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
