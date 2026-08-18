"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAllSkuCosts } from "@/hooks/use-sku-costs";
import { SkuCostOverviewItem } from "@/types/sku-cost.types";
import { ProfitabilityBadge } from "@/components/profit/profitability-badge";
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
  Layers,
  Search,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Loader2,
  ArrowLeft,
  Calendar,
} from "lucide-react";

export default function SkuCostsPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [editingSku, setEditingSku] = useState<{
    sku: string;
    productName?: string;
    costs?: any;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { data: skuCosts = [], isLoading, refetch } = useAllSkuCosts();

  const totalCount = skuCosts.length;
  const completeCount = skuCosts.filter((s) => s.status === "COMPLETE").length;
  const partialCount = skuCosts.filter((s) => s.status === "PARTIAL").length;
  const missingCount = skuCosts.filter((s) => s.status === "MISSING").length;

  const filteredSkus = skuCosts.filter((s: SkuCostOverviewItem) => {
    const matchesSearch =
      s.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.productName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "COMPLETE") return s.status === "COMPLETE";
    if (statusFilter === "PARTIAL") return s.status === "PARTIAL";
    if (statusFilter === "MISSING") return s.status === "MISSING";

    return true;
  });

  const handleEdit = (skuItem: SkuCostOverviewItem) => {
    setEditingSku({
      sku: skuItem.sku,
      productName: skuItem.productName,
      costs: {
        productCostPerUnit: skuItem.productCostPerUnit,
        logisticsCostPerUnit: skuItem.logisticsCostPerUnit,
        packagingCostPerUnit: skuItem.packagingCostPerUnit,
        otherCostPerUnit: skuItem.otherCostPerUnit,
        notes: skuItem.notes,
      },
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link
              href="/analytics/actual-profit"
              title="Back to Profit Analytics"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              SKU Master & Custom Unit Cost Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set product, logistics, packaging & other custom unit expenses for
              accurate actual profit tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs cursor-pointer"
          >
            <Link href="/analytics/actual-profit">
              View Profit Intelligence
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] text-muted-foreground block font-semibold">
            Total SKUs
          </span>
          <span className="text-xl font-bold font-mono text-foreground">
            {totalCount}
          </span>
        </Card>

        <Card className="border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Complete Costs
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {completeCount}
          </span>
        </Card>

        <Card className="border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Incomplete Costs
          </span>
          <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {partialCount}
          </span>
        </Card>

        <Card className="border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] text-sky-600 dark:text-sky-400 block font-semibold flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            Missing Costs
          </span>
          <span className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {missingCount}
          </span>
        </Card>
      </div>

      {/* Search and Filters Table Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="p-4 border-b border-border space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search SKU or Product Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs pl-8 font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs min-w-[150px]">
                  <SelectValue placeholder="Filter Cost Status" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ALL">All SKUs ({totalCount})</SelectItem>
                  <SelectItem value="COMPLETE">
                    Complete Costs ({completeCount})
                  </SelectItem>
                  <SelectItem value="PARTIAL">
                    Incomplete Costs ({partialCount})
                  </SelectItem>
                  <SelectItem value="MISSING">
                    Missing Costs ({missingCount})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Loading SKU cost master...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-muted/40 font-semibold">
                  <TableRow>
                    <TableHead className="py-2.5 pl-4">SKU & Product</TableHead>
                    <TableHead className="py-2.5 text-right">
                      Product / Unit
                    </TableHead>
                    <TableHead className="py-2.5 text-right">
                      Logistics / Unit
                    </TableHead>
                    <TableHead className="py-2.5 text-right">
                      Packaging / Unit
                    </TableHead>
                    <TableHead className="py-2.5 text-right">
                      Other / Unit
                    </TableHead>
                    <TableHead className="py-2.5 text-right font-bold">
                      Total Cost / Unit
                    </TableHead>
                    <TableHead className="py-2.5 text-center">Status</TableHead>
                    <TableHead className="py-2.5 pr-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSkus.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No SKUs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSkus.map((skuItem) => (
                      <TableRow
                        key={skuItem.sku}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* SKU & Product */}
                        <TableCell className="py-2.5 pl-4 max-w-[240px]">
                          <Link
                            href={`/sku/${encodeURIComponent(skuItem.sku)}`}
                            className="font-mono font-bold text-foreground hover:text-primary hover:underline block truncate"
                          >
                            {skuItem.sku}
                          </Link>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {skuItem.productName}
                          </span>
                        </TableCell>

                        {/* Product Cost */}
                        <TableCell className="py-2.5 text-right font-mono">
                          {skuItem.productCostPerUnit !== null ? (
                            `₹${skuItem.productCostPerUnit}`
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Logistics Cost */}
                        <TableCell className="py-2.5 text-right font-mono">
                          {skuItem.logisticsCostPerUnit !== null ? (
                            `₹${skuItem.logisticsCostPerUnit}`
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Packaging Cost */}
                        <TableCell className="py-2.5 text-right font-mono">
                          {skuItem.packagingCostPerUnit !== null ? (
                            `₹${skuItem.packagingCostPerUnit}`
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Other Cost */}
                        <TableCell className="py-2.5 text-right font-mono">
                          {skuItem.otherCostPerUnit !== null ? (
                            `₹${skuItem.otherCostPerUnit}`
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Total Cost Per Unit */}
                        <TableCell className="py-2.5 text-right font-mono font-bold text-foreground">
                          {skuItem.totalSellerCostPerUnit !== null ? (
                            `₹${skuItem.totalSellerCostPerUnit}`
                          ) : (
                            <span className="text-amber-500 font-sans text-[11px] font-semibold">
                              Incomplete
                            </span>
                          )}
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="py-2.5 text-center">
                          <ProfitabilityBadge
                            status={
                              skuItem.status === "COMPLETE"
                                ? "PROFITABLE"
                                : "MISSING_COST"
                            }
                            costStatus={skuItem.status}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-2.5 pr-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(skuItem)}
                            className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingSku && (
        <EditSkuCostModal
          sku={editingSku.sku}
          productName={editingSku.productName}
          initialCosts={editingSku.costs}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
