"use client";

import React, { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Filter,
  IndianRupee,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Layers,
  Sparkles,
  Table as TableIcon,
  HelpCircle,
  Truck,
  ArrowUpDown,
  Home,
  Clock,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Boxes,
  Tag,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useReportImports } from "@/hooks/use-report-imports";
import { useSettlementReportData } from "@/hooks/use-settlement-reports";
import { SettlementOrderRecord } from "@/features/reports/types/report.types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SettlementReportDynamicPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;
  const router = useRouter();

  const { data: allReports = [] } = useReportImports();
  const { data: settlementData, isLoading, error } = useSettlementReportData(reportId);

  // Settlement only reports for switcher
  const settlementReports = useMemo(() => {
    return allReports.filter(
      (r) =>
        r.reportType === "FLIPKART_SETTLEMENTS" ||
        r.fileName.toLowerCase().includes("settled") ||
        r.fileName.toLowerCase().includes("settlement")
    );
  }, [allReports]);

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<string>("orders");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [neftFilter, setNeftFilter] = useState<string>("ALL");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("settlement_desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReportSwitch = (newId: string) => {
    if (newId && newId !== reportId) {
      router.push(`/settlements/${newId}`);
    }
  };

  const orders = settlementData?.orders || [];
  const summary = settlementData?.summary || {
    saleOrdersCount: 0,
    returnsCount: 0,
    ordersSettlement: 0,
    protectionFundClaim: 0,
    mpFeeRebate: 0,
    servicesFees: 0,
    taxSettlement: 0,
    netBankSettlement: 0,
    inputGstTcsCredits: 0,
    incomeTaxCredits: 0,
    totalRealizableAmount: 0,
  };
  const gstDetails = settlementData?.gstDetails || [];
  const ads = settlementData?.ads || [];
  const reportMeta = settlementData?.report;

  // Extract unique NEFT IDs for batch filter
  const uniqueNeftBatches = useMemo(() => {
    const map = new Map<string, { neftId: string; totalAmount: number; count: number; date?: string | Date | null }>();
    orders.forEach((o) => {
      if (!o.neftId) return;
      if (!map.has(o.neftId)) {
        map.set(o.neftId, { neftId: o.neftId, totalAmount: 0, count: 0, date: o.paymentDate });
      }
      const b = map.get(o.neftId)!;
      b.totalAmount += o.bankSettlementValue;
      b.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [orders]);

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Status filter
        if (statusFilter === "DELIVERED") {
          const isReturn =
            (o.returnType && o.returnType !== "NA" && o.returnType !== "") ||
            (o.itemReturnStatus && o.itemReturnStatus.toLowerCase() === "returned") ||
            o.refund < 0;
          if (isReturn) return false;
        }
        if (statusFilter === "CUSTOMER_RETURN") {
          const isCustomerReturn =
            o.returnType?.toLowerCase().includes("customer") ||
            (o.returnType?.toUpperCase() === "RVP");
          if (!isCustomerReturn) return false;
        }
        if (statusFilter === "LOGISTICS_RETURN") {
          const isLogisticsReturn =
            o.returnType?.toLowerCase().includes("logistics") ||
            (o.returnType?.toUpperCase() === "RTO");
          if (!isLogisticsReturn) return false;
        }
        if (statusFilter === "REPLACEMENT") {
          const isReplacement =
            o.additionalInformation?.toUpperCase().includes("REPLACEMENT");
          if (!isReplacement) return false;
        }
        if (statusFilter === "SPF") {
          if (!o.protectionFund || o.protectionFund <= 0) return false;
        }

        // Channel filter
        if (channelFilter === "SHOPSY" && (!o.shopsyOrder || o.shopsyOrder.toLowerCase() === "no")) return false;
        if (channelFilter === "FLIPKART" && o.shopsyOrder && o.shopsyOrder.toLowerCase() === "yes") return false;

        // NEFT Batch filter
        if (neftFilter !== "ALL" && o.neftId !== neftFilter) return false;

        // Payment Type filter
        if (paymentTypeFilter !== "ALL" && o.neftType?.toUpperCase() !== paymentTypeFilter) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSku = o.sellerSku.toLowerCase().includes(q);
          const matchOrder = o.orderId.toLowerCase().includes(q);
          const matchItem = o.orderItemId.toLowerCase().includes(q);
          const matchNeft = o.neftId ? o.neftId.toLowerCase().includes(q) : false;
          const matchSubCat = o.productSubCategory ? o.productSubCategory.toLowerCase().includes(q) : false;
          const matchInvoice = o.invoiceId ? o.invoiceId.toLowerCase().includes(q) : false;
          return matchSku || matchOrder || matchItem || matchNeft || matchSubCat || matchInvoice;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "settlement_desc") return b.bankSettlementValue - a.bankSettlementValue;
        if (sortBy === "settlement_asc") return a.bankSettlementValue - b.bankSettlementValue;
        if (sortBy === "sale_desc") return b.saleAmount - a.saleAmount;
        if (sortBy === "sku_asc") return a.sellerSku.localeCompare(b.sellerSku);
        if (sortBy === "date_desc") {
          const dA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
          const dB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
          return dB - dA;
        }
        return 0;
      });
  }, [orders, statusFilter, channelFilter, neftFilter, paymentTypeFilter, searchQuery, sortBy]);

  // Aggregated SKU Performance
  const skuAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        sku: string;
        subCategory?: string;
        ordersCount: number;
        units: number;
        saleAmount: number;
        marketplaceFees: number;
        taxes: number;
        protectionFund: number;
        refunds: number;
        bankSettlement: number;
        inputGstTcs: number;
        tds: number;
        realizableAmount: number;
      }
    >();

    for (const o of orders) {
      const sku = o.sellerSku || "UNKNOWN";
      if (!map.has(sku)) {
        map.set(sku, {
          sku,
          subCategory: o.productSubCategory,
          ordersCount: 0,
          units: 0,
          saleAmount: 0,
          marketplaceFees: 0,
          taxes: 0,
          protectionFund: 0,
          refunds: 0,
          bankSettlement: 0,
          inputGstTcs: 0,
          tds: 0,
          realizableAmount: 0,
        });
      }
      const item = map.get(sku)!;
      item.ordersCount += 1;
      item.units += o.quantity || 1;
      item.saleAmount += o.saleAmount;
      item.marketplaceFees += o.marketplaceFee;
      item.taxes += o.taxes;
      item.protectionFund += o.protectionFund;
      item.refunds += o.refund;
      item.bankSettlement += o.bankSettlementValue;
      item.inputGstTcs += o.inputGstTcsCredits;
      item.tds += o.incomeTaxCredits;
      item.realizableAmount += o.bankSettlementValue + o.inputGstTcsCredits + o.incomeTaxCredits;
    }

    return Array.from(map.values()).sort((a, b) => b.bankSettlement - a.bankSettlement);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Settled Transactions from database...</span>
      </div>
    );
  }

  if (error || !settlementData) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Settlement Report Not Found</h3>
        <p className="text-xs text-muted-foreground">
          The requested settlement report ID does not exist or has not been imported.
        </p>
        <Button asChild size="sm" variant="outline" className="text-xs">
          <Link href="/reports">View Report Archive</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky SaaS Top Navigation */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Back to Reports"
          >
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              Flipkart Settled Transactions Ledger
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold"
            >
              {reportMeta?.periodLabel || "June 2026"}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4 gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Database Persisted
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Report Switcher Dropdown */}
          {settlementReports.length > 1 && (
            <Select value={reportId} onValueChange={handleReportSwitch}>
              <SelectTrigger className="h-7 text-xs w-[190px] font-medium bg-background border-border shadow-2xs cursor-pointer">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Switch Settlement" />
              </SelectTrigger>
              <SelectContent className="text-xs max-h-60">
                {settlementReports.map((r) => (
                  <SelectItem key={r._id} value={r._id}>
                    <span className="font-semibold">{r.periodLabel}</span>{" "}
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({r.fileName.slice(0, 16)}...)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
          >
            <Link href="/reports">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              Archive
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
          >
            <Link href="/">
              <Home className="h-3.5 w-3.5 mr-1" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Cards Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Net Bank Settlement */}
          <Card className="border border-border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Net Bank Settlement</span>
              <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{summary.netBankSettlement.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-muted-foreground">Direct bank deposits</div>
          </Card>

          {/* 2. Input GST + TCS Credits */}
          <Card className="border border-border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>GST + TCS Credits</span>
              <Receipt className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
              ₹{summary.inputGstTcsCredits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-muted-foreground">Input tax credit</div>
          </Card>

          {/* 3. Income Tax / TDS Credits */}
          <Card className="border border-border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>TDS Credits</span>
              <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
              ₹{summary.incomeTaxCredits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-muted-foreground">Tax deducted at source</div>
          </Card>

          {/* 4. Total Realizable Amount */}
          <Card className="border border-emerald-500/30 bg-emerald-500/5 p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span>Total Realizable</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
              ₹{summary.totalRealizableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-muted-foreground">Bank + GST/TCS + TDS</div>
          </Card>

          {/* 5. Orders & Returns */}
          <Card className="border border-border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Settled Orders</span>
              <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {summary.saleOrdersCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({summary.returnsCount} returns)
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {orders.length > 0
                ? `${((summary.returnsCount / orders.length) * 100).toFixed(1)}% return rate`
                : "0% returns"}
            </div>
          </Card>

          {/* 6. Seller Protection Fund (SPF) */}
          <Card className="border border-border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Protection Fund</span>
              <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
            </div>
            <div className="text-lg font-bold font-mono text-violet-600 dark:text-violet-400">
              ₹{summary.protectionFundClaim.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-muted-foreground">Approved claims & SPF</div>
          </Card>
        </div>

        {/* Tabbed Interactive Panels */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/60 p-1 border border-border">
            <TabsTrigger value="orders" className="text-xs font-medium cursor-pointer gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              Settled Orders
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                {orders.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="neft" className="text-xs font-medium cursor-pointer gap-1.5">
              <Boxes className="h-3.5 w-3.5" />
              NEFT Batches
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                {uniqueNeftBatches.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="skus" className="text-xs font-medium cursor-pointer gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              SKU Settlement
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                {skuAggregates.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="gst" className="text-xs font-medium cursor-pointer gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              GST Fee Details
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                {gstDetails.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="ads" className="text-xs font-medium cursor-pointer gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Ads & Services
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                {ads.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="reconciliation" className="text-xs font-medium cursor-pointer gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Reconciliation Waterfall
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Settled Orders */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-4 border-b border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Settled Order Transactions ({filteredOrders.length} records)
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Item-level settlement value, marketplace fee deductions, tax credits, and logistics specs.
                    </CardDescription>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search SKU, Order ID, NEFT, Invoice..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>

                {/* Filters Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1">Status:</span>
                    {[
                      { key: "ALL", label: "All" },
                      { key: "DELIVERED", label: "Delivered" },
                      { key: "CUSTOMER_RETURN", label: "Customer Returns (RVP)" },
                      { key: "LOGISTICS_RETURN", label: "Logistics Returns (RTO)" },
                      { key: "REPLACEMENT", label: "Replacements" },
                      { key: "SPF", label: "SPF Claims" },
                    ].map((st) => (
                      <Button
                        key={st.key}
                        variant={statusFilter === st.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(st.key)}
                        className="h-6 px-2 text-[11px] font-mono cursor-pointer"
                      >
                        {st.label}
                      </Button>
                    ))}

                    <span className="text-xs text-muted-foreground ml-3 mr-1">Channel:</span>
                    {["ALL", "FLIPKART", "SHOPSY"].map((ch) => (
                      <Button
                        key={ch}
                        variant={channelFilter === ch ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChannelFilter(ch)}
                        className="h-6 px-2 text-[11px] font-mono cursor-pointer"
                      >
                        {ch}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {uniqueNeftBatches.length > 1 && (
                      <Select value={neftFilter} onValueChange={setNeftFilter}>
                        <SelectTrigger className="h-7 text-xs w-[170px] bg-background">
                          <SelectValue placeholder="All NEFTs" />
                        </SelectTrigger>
                        <SelectContent className="text-xs max-h-56">
                          <SelectItem value="ALL">All NEFT Batches ({uniqueNeftBatches.length})</SelectItem>
                          {uniqueNeftBatches.map((b) => (
                            <SelectItem key={b.neftId} value={b.neftId}>
                              <span className="font-mono text-[10px]">{b.neftId.slice(0, 16)}...</span>{" "}
                              <span className="font-bold text-emerald-600">₹{b.totalAmount.toFixed(0)}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-7 text-xs w-[170px] bg-background">
                        <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="settlement_desc">Bank Settlement (High)</SelectItem>
                        <SelectItem value="settlement_asc">Bank Settlement (Low)</SelectItem>
                        <SelectItem value="sale_desc">Sale Amount (High)</SelectItem>
                        <SelectItem value="date_desc">Payment Date (Latest)</SelectItem>
                        <SelectItem value="sku_asc">SKU (A–Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">
                  <Table className="text-xs w-full min-w-[1300px]">
                    <TableHeader className="bg-muted/40 font-semibold border-b border-border">
                      <TableRow>
                        <TableHead className="py-2.5 pl-4 w-[160px]">Payment & NEFT</TableHead>
                        <TableHead className="py-2.5 w-[200px]">Order ID & Invoice</TableHead>
                        <TableHead className="py-2.5 min-w-[160px]">Seller SKU</TableHead>
                        <TableHead className="py-2.5 text-right w-[100px]">Sale Amount</TableHead>
                        <TableHead className="py-2.5 text-right w-[110px]">MP Fees</TableHead>
                        <TableHead className="py-2.5 text-right w-[90px]">Taxes</TableHead>
                        <TableHead className="py-2.5 text-right w-[100px]">SPF / Refund</TableHead>
                        <TableHead className="py-2.5 text-right w-[130px]">Bank Settlement</TableHead>
                        <TableHead className="py-2.5 text-center w-[130px]">Weight & Zone</TableHead>
                        <TableHead className="py-2.5 pr-4 text-center w-[120px]">Return Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                            No settled transactions match the selected filter criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((o, idx) => {
                          const isCustomerReturn =
                            o.returnType?.toLowerCase().includes("customer") ||
                            o.returnType?.toUpperCase() === "RVP";
                          const isLogisticsReturn =
                            o.returnType?.toLowerCase().includes("logistics") ||
                            o.returnType?.toUpperCase() === "RTO";
                          const isReplacement =
                            o.additionalInformation?.toUpperCase().includes("REPLACEMENT");
                          const isReturn = isCustomerReturn || isLogisticsReturn || o.refund < 0;

                          return (
                            <TableRow
                              key={`${o.orderItemId}_${idx}`}
                              className="hover:bg-muted/30 transition-colors border-b border-border/60 font-mono text-[11px]"
                            >
                              {/* 1. Payment & NEFT */}
                              <TableCell className="py-2.5 pl-4">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground block">
                                      {o.paymentDate
                                        ? new Date(o.paymentDate).toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                          })
                                        : "—"}
                                    </span>
                                    {o.neftType && (
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] px-1 py-0 h-3.5 uppercase ${
                                          o.neftType.toLowerCase() === "prepaid"
                                            ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                            : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                                        }`}
                                      >
                                        {o.neftType}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className="text-[10px] text-muted-foreground block truncate max-w-[120px]"
                                      title={o.neftId}
                                    >
                                      {o.neftId || "NEFT Pending"}
                                    </span>
                                    {o.neftId && (
                                      <button
                                        onClick={() => copyToClipboard(o.neftId!)}
                                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                                        title="Copy NEFT ID"
                                      >
                                        {copiedId === o.neftId ? (
                                          <Check className="h-2.5 w-2.5 text-emerald-500" />
                                        ) : (
                                          <Copy className="h-2.5 w-2.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </TableCell>

                              {/* 2. Order ID & Item */}
                              <TableCell className="py-2.5">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-foreground block truncate max-w-[160px]" title={o.orderId}>
                                      {o.orderId}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(o.orderId)}
                                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                                      title="Copy Order ID"
                                    >
                                      {copiedId === o.orderId ? (
                                        <Check className="h-2.5 w-2.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-2.5 w-2.5" />
                                      )}
                                    </button>
                                  </div>
                                  {o.invoiceId && o.invoiceId !== "NA" && (
                                    <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]" title={o.invoiceId}>
                                      Inv: {o.invoiceId}
                                    </span>
                                  )}
                                  {o.orderDate && (
                                    <span className="text-[9px] text-muted-foreground block">
                                      Ord: {new Date(o.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                      {o.dispatchDate ? ` • Disp: ${new Date(o.dispatchDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : ""}
                                    </span>
                                  )}
                                </div>
                              </TableCell>

                              {/* 3. SKU & Sub Category */}
                              <TableCell className="py-2.5 font-bold text-foreground">
                                <span className="truncate block max-w-[160px]" title={o.sellerSku}>
                                  {o.sellerSku}
                                </span>
                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                  {o.productSubCategory && o.productSubCategory !== "NA" && (
                                    <span className="text-[9px] text-muted-foreground font-normal lowercase">
                                      {o.productSubCategory.replace(/_/g, " ")}
                                    </span>
                                  )}
                                  {o.shopsyOrder?.toLowerCase() === "yes" && (
                                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-violet-500/10 text-violet-600 border-violet-500/30">
                                      Shopsy
                                    </Badge>
                                  )}
                                  {isReplacement && (
                                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-blue-500/10 text-blue-600 border-blue-500/30">
                                      Repl.
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>

                              {/* 4. Sale Amount */}
                              <TableCell className="py-2.5 text-right font-semibold text-foreground">
                                ₹{o.saleAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                {o.totalOfferAmount > 0 && (
                                  <span className="text-[9px] text-muted-foreground block font-normal">
                                    Offer: -₹{o.totalOfferAmount}
                                  </span>
                                )}
                              </TableCell>

                              {/* 5. Marketplace Fees */}
                              <TableCell className="py-2.5 text-right font-medium text-rose-600 dark:text-rose-400">
                                ₹{o.marketplaceFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                {o.reverseShippingFee < 0 && (
                                  <span className="text-[9px] text-rose-500 block font-normal">
                                    Rev: ₹{o.reverseShippingFee}
                                  </span>
                                )}
                              </TableCell>

                              {/* 6. Taxes */}
                              <TableCell className="py-2.5 text-right text-muted-foreground">
                                ₹{o.taxes.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </TableCell>

                              {/* 7. Protection Fund / Refund */}
                              <TableCell className="py-2.5 text-right">
                                {o.protectionFund > 0 ? (
                                  <span className="text-emerald-600 font-semibold">+₹{o.protectionFund}</span>
                                ) : o.refund < 0 ? (
                                  <span className="text-rose-600 font-semibold">₹{o.refund}</span>
                                ) : (
                                  <span className="text-muted-foreground">₹0</span>
                                )}
                              </TableCell>

                              {/* 8. Bank Settlement Value */}
                              <TableCell className="py-2.5 text-right">
                                <Badge
                                  variant="outline"
                                  className={`text-[11px] font-mono font-bold px-2 py-0.5 ${
                                    o.bankSettlementValue > 0
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                      : o.bankSettlementValue < 0
                                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                                      : "bg-muted text-muted-foreground border-border"
                                  }`}
                                >
                                  ₹{o.bankSettlementValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </Badge>
                                {(o.inputGstTcsCredits > 0 || o.incomeTaxCredits > 0) && (
                                  <span className="text-[9px] text-blue-600 dark:text-blue-400 block font-normal mt-0.5">
                                    +₹{(o.inputGstTcsCredits + o.incomeTaxCredits).toFixed(1)} cr
                                  </span>
                                )}
                              </TableCell>

                              {/* 9. Weight & Zone */}
                              <TableCell className="py-2.5 text-center text-[10px] text-muted-foreground">
                                {o.deadWeight && o.deadWeight > 0 ? (
                                  <div>
                                    <span>{o.deadWeight} kg</span>
                                    {o.shippingZone && o.shippingZone !== "NA" && ` • ${o.shippingZone}`}
                                  </div>
                                ) : o.shippingZone && o.shippingZone !== "NA" ? (
                                  <span>{o.shippingZone}</span>
                                ) : (
                                  <span>—</span>
                                )}
                                {o.dimensions && o.dimensions !== "NA" && (
                                  <span className="text-[9px] block text-muted-foreground truncate max-w-[120px]" title={o.dimensions}>
                                    {o.dimensions}
                                  </span>
                                )}
                              </TableCell>

                              {/* 10. Return Status */}
                              <TableCell className="py-2.5 pr-4 text-center">
                                {isCustomerReturn ? (
                                  <div className="space-y-0.5">
                                    <Badge
                                      variant="outline"
                                      className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[9px] font-mono px-1.5 py-0"
                                    >
                                      CUSTOMER RETURN
                                    </Badge>
                                    {o.itemReturnStatus && o.itemReturnStatus !== "NA" && (
                                      <span className="text-[9px] text-muted-foreground block">
                                        {o.itemReturnStatus}
                                      </span>
                                    )}
                                  </div>
                                ) : isLogisticsReturn ? (
                                  <div className="space-y-0.5">
                                    <Badge
                                      variant="outline"
                                      className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[9px] font-mono px-1.5 py-0"
                                    >
                                      LOGISTICS RETURN
                                    </Badge>
                                    {o.itemReturnStatus && o.itemReturnStatus !== "NA" && (
                                      <span className="text-[9px] text-muted-foreground block">
                                        {o.itemReturnStatus}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-mono px-1.5 py-0"
                                  >
                                    DELIVERED
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: NEFT Batches */}
          <TabsContent value="neft" className="space-y-4">
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground">
                  Flipkart Settlement NEFT Batches ({uniqueNeftBatches.length} Payouts)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Bank transfer reference identifiers, transaction dates, order counts, and net payouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">
                  <Table className="text-xs w-full min-w-[700px]">
                    <TableHeader className="bg-muted/40 font-semibold border-b border-border">
                      <TableRow>
                        <TableHead className="py-2.5 pl-4 w-[280px]">NEFT Transaction ID</TableHead>
                        <TableHead className="py-2.5 w-[140px]">Payment Date</TableHead>
                        <TableHead className="py-2.5 text-center w-[120px]">Orders Count</TableHead>
                        <TableHead className="py-2.5 pr-4 text-right w-[160px]">Net Payout Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueNeftBatches.map((b) => (
                        <TableRow
                          key={b.neftId}
                          className="hover:bg-muted/30 transition-colors border-b border-border/60 font-mono text-[11px]"
                        >
                          <TableCell className="py-2.5 pl-4 font-bold text-foreground">
                            <div className="flex items-center gap-1.5">
                              <span>{b.neftId}</span>
                              <button
                                onClick={() => copyToClipboard(b.neftId)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Copy NEFT ID"
                              >
                                {copiedId === b.neftId ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">
                            {b.date
                              ? new Date(b.date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="py-2.5 text-center font-semibold text-foreground">
                            {b.count} orders
                          </TableCell>
                          <TableCell className="py-2.5 pr-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{b.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SKU Settlement Summary */}
          <TabsContent value="skus" className="space-y-4">
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground">
                  SKU Settlement Breakdown ({skuAggregates.length} SKUs)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Consolidated financial settlement metrics aggregated per SKU.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">
                  <Table className="text-xs w-full min-w-[960px]">
                    <TableHeader className="bg-muted/40 font-semibold border-b border-border">
                      <TableRow>
                        <TableHead className="py-2.5 pl-4 min-w-[180px]">Seller SKU</TableHead>
                        <TableHead className="py-2.5 text-center w-[100px]">Orders / Qty</TableHead>
                        <TableHead className="py-2.5 text-right w-[120px]">Gross Sales</TableHead>
                        <TableHead className="py-2.5 text-right w-[120px]">Marketplace Fees</TableHead>
                        <TableHead className="py-2.5 text-right w-[110px]">Taxes</TableHead>
                        <TableHead className="py-2.5 text-right w-[130px]">Bank Settlement</TableHead>
                        <TableHead className="py-2.5 pr-4 text-right w-[140px]">Realizable Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skuAggregates.map((s) => (
                        <TableRow
                          key={s.sku}
                          className="hover:bg-muted/30 transition-colors border-b border-border/60 font-mono text-[11px]"
                        >
                          <TableCell className="py-2.5 pl-4 font-bold text-foreground">
                            {s.sku}
                            {s.subCategory && s.subCategory !== "NA" && (
                              <span className="text-[10px] text-muted-foreground font-normal block lowercase">
                                {s.subCategory.replace(/_/g, " ")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 text-center text-muted-foreground">
                            {s.ordersCount} ({s.units} units)
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-semibold text-foreground">
                            ₹{s.saleAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-medium text-rose-600 dark:text-rose-400">
                            ₹{s.marketplaceFees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-muted-foreground">
                            ₹{s.taxes.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{s.bankSettlement.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="py-2.5 pr-4 text-right font-bold text-emerald-700 dark:text-emerald-300">
                            ₹{s.realizableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: GST Fee Details */}
          <TabsContent value="gst" className="space-y-4">
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground">
                  Itemized Fee GST Tax Ledger ({gstDetails.length} items)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Exact CGST, SGST, and IGST breakdowns deducted on marketplace commission, fixed fees, and shipping.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">
                  <Table className="text-xs w-full min-w-[900px]">
                    <TableHeader className="bg-muted/40 font-semibold border-b border-border">
                      <TableRow>
                        <TableHead className="py-2.5 pl-4 w-[180px]">Fee Name</TableHead>
                        <TableHead className="py-2.5 w-[140px]">Service Type</TableHead>
                        <TableHead className="py-2.5 w-[180px]">Reference / Item ID</TableHead>
                        <TableHead className="py-2.5 text-right w-[110px]">Fee Amount</TableHead>
                        <TableHead className="py-2.5 text-right w-[90px]">CGST</TableHead>
                        <TableHead className="py-2.5 text-right w-[90px]">SGST</TableHead>
                        <TableHead className="py-2.5 text-right w-[90px]">IGST</TableHead>
                        <TableHead className="py-2.5 pr-4 text-right w-[110px]">Total GST</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gstDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                            No GST detail records found in this settlement workbook.
                          </TableCell>
                        </TableRow>
                      ) : (
                        gstDetails.map((g, idx) => (
                          <TableRow
                            key={idx}
                            className="hover:bg-muted/30 transition-colors border-b border-border/60 font-mono text-[11px]"
                          >
                            <TableCell className="py-2.5 pl-4 font-bold text-foreground">
                              {g.feeName}
                            </TableCell>
                            <TableCell className="py-2.5 text-muted-foreground">
                              {g.serviceType || "Order Item"}
                            </TableCell>
                            <TableCell className="py-2.5 text-muted-foreground truncate max-w-[160px]" title={g.referenceId}>
                              {g.referenceId || "—"}
                            </TableCell>
                            <TableCell className="py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                              ₹{g.feeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="py-2.5 text-right text-muted-foreground">
                              ₹{g.cgstAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="py-2.5 text-right text-muted-foreground">
                              ₹{g.sgstAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="py-2.5 text-right text-muted-foreground">
                              ₹{g.igstAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="py-2.5 pr-4 text-right font-bold text-foreground">
                              ₹{g.totalGst.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: Ads & Services */}
          <TabsContent value="ads" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-border bg-card shadow-xs">
                <CardHeader className="p-4 border-b border-border">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Advertising Transactions ({ads.length} items)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Flipkart Advertising wallet redeems, topups, and GST charges.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 font-mono text-xs">
                  {ads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No advertising transactions found.
                    </div>
                  ) : (
                    ads.map((a, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground uppercase">{a.type || "Ads Transaction"}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {a.campaignTransactionId || "No Campaign ID"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground block">
                            ₹{a.settlementValue.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            GST: ₹{a.gstOnAdsFees?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border bg-card shadow-xs">
                <CardHeader className="p-4 border-b border-border">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Non-Order & Service Fees Summary
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Storage & recall charges, marketplace fee rebates, and service deductions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                    <span className="font-medium text-foreground">Marketplace Fee Rebate</span>
                    <span className="font-bold text-emerald-600">₹{summary.mpFeeRebate.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                    <span className="font-medium text-foreground">Services Fees</span>
                    <span className="font-bold text-rose-600">₹{summary.servicesFees.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                    <span className="font-medium text-foreground">Tax Settlement Adjustments</span>
                    <span className="font-bold text-foreground">₹{summary.taxSettlement.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Protection Fund (SPF) Claim</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      +₹{summary.protectionFundClaim.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 6: Reconciliation Waterfall */}
          <TabsContent value="reconciliation" className="space-y-4">
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground">
                  Flipkart Settlement Reconciliation Waterfall
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Step-by-step mathematical reconciliation explaining how Flipkart calculated final bank payouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-2xl mx-auto space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <span className="font-semibold text-foreground">Orders Settlement Component</span>
                    <span className="font-bold text-foreground">
                      ₹{summary.ordersSettlement.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <span className="font-semibold text-foreground">Marketplace Fee Rebate</span>
                    <span className="font-bold text-emerald-600">
                      +₹{summary.mpFeeRebate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <span className="font-semibold text-foreground">Protection Fund (SPF) Claims</span>
                    <span className="font-bold text-emerald-600">
                      +₹{summary.protectionFundClaim.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <span className="font-semibold text-foreground">Services Fees</span>
                    <span className="font-bold text-rose-600">
                      -₹{summary.servicesFees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <span className="font-semibold text-foreground">Tax Settlement</span>
                    <span className="font-bold text-foreground">
                      ₹{summary.taxSettlement.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="my-2 border-t-2 border-dashed border-border" />

                  <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10">
                    <span className="font-bold text-sm text-foreground">Net Bank Settlement (Cash Deposited)</span>
                    <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                      ₹{summary.netBankSettlement.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <span className="font-semibold text-foreground">(+) Input GST + TCS Tax Credits</span>
                    <span className="font-bold text-blue-600">
                      +₹{summary.inputGstTcsCredits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <span className="font-semibold text-foreground">(+) Income Tax / TDS Tax Credits</span>
                    <span className="font-bold text-indigo-600">
                      +₹{summary.incomeTaxCredits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="my-2 border-t-2 border-dashed border-border" />

                  <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-600/60 bg-emerald-600/15">
                    <span className="font-bold text-sm text-foreground">
                      Total Realizable Financial Amount
                    </span>
                    <span className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
                      ₹{summary.totalRealizableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
