"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveSkuCostProfile } from "@/hooks/use-sku-costs";
import { CostApplyScope } from "@/types/sku-cost.types";
import { Calculator, Loader2, Sparkles } from "lucide-react";

interface EditSkuCostModalProps {
  sku: string;
  productName?: string;
  initialCosts?: {
    productCostPerUnit?: number | null;
    logisticsCostPerUnit?: number | null;
    packagingCostPerUnit?: number | null;
    otherCostPerUnit?: number | null;
    notes?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditSkuCostModal({
  sku,
  productName,
  initialCosts,
  open,
  onOpenChange,
  onSuccess,
}: EditSkuCostModalProps) {
  const [productCost, setProductCost] = useState<string>("");
  const [logisticsCost, setLogisticsCost] = useState<string>("");
  const [packagingCost, setPackagingCost] = useState<string>("");
  const [otherCost, setOtherCost] = useState<string>("");
  const [applyScope, setApplyScope] = useState<CostApplyScope>("all-history");
  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const saveMutation = useSaveSkuCostProfile();

  useEffect(() => {
    if (open) {
      setProductCost(
        initialCosts?.productCostPerUnit !== null && initialCosts?.productCostPerUnit !== undefined
          ? String(initialCosts.productCostPerUnit)
          : ""
      );
      setLogisticsCost(
        initialCosts?.logisticsCostPerUnit !== null && initialCosts?.logisticsCostPerUnit !== undefined
          ? String(initialCosts.logisticsCostPerUnit)
          : ""
      );
      setPackagingCost(
        initialCosts?.packagingCostPerUnit !== null && initialCosts?.packagingCostPerUnit !== undefined
          ? String(initialCosts.packagingCostPerUnit)
          : ""
      );
      setOtherCost(
        initialCosts?.otherCostPerUnit !== null && initialCosts?.otherCostPerUnit !== undefined
          ? String(initialCosts.otherCostPerUnit)
          : ""
      );
      setNotes(initialCosts?.notes || "");
      setApplyScope("all-history");
      setEffectiveDate(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    }
  }, [open, initialCosts]);

  // Calculate live total preview
  const numP = productCost.trim() === "" ? null : parseFloat(productCost);
  const numL = logisticsCost.trim() === "" ? null : parseFloat(logisticsCost);
  const numPk = packagingCost.trim() === "" ? null : parseFloat(packagingCost);
  const numO = otherCost.trim() === "" ? null : parseFloat(otherCost);

  const isAllFilled = numP !== null && numL !== null && numPk !== null && numO !== null;
  const totalPreview = (numP || 0) + (numL || 0) + (numPk || 0) + (numO || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await saveMutation.mutateAsync({
      sku,
      productCostPerUnit: isNaN(numP as number) || numP === null ? null : numP,
      logisticsCostPerUnit: isNaN(numL as number) || numL === null ? null : numL,
      packagingCostPerUnit: isNaN(numPk as number) || numPk === null ? null : numPk,
      otherCostPerUnit: isNaN(numO as number) || numO === null ? null : numO,
      applyScope,
      effectiveFrom: applyScope === "selected-period" && effectiveDate ? effectiveDate : null,
      notes: notes.trim() || undefined,
    });

    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Configure SKU Business Costs</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define seller unit expenses for <strong className="font-mono text-foreground">{sku}</strong>.
              {productName && <span className="block mt-0.5">{productName}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {/* 4 Cost fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="productCost" className="text-xs font-medium">
                  Product Cost / Unit (₹)
                </Label>
                <Input
                  id="productCost"
                  type="number"
                  step="any"
                  placeholder="e.g. 25"
                  value={productCost}
                  onChange={(e) => setProductCost(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="logisticsCost" className="text-xs font-medium">
                  Logistics Cost / Unit (₹)
                </Label>
                <Input
                  id="logisticsCost"
                  type="number"
                  step="any"
                  placeholder="e.g. 10"
                  value={logisticsCost}
                  onChange={(e) => setLogisticsCost(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="packagingCost" className="text-xs font-medium">
                  Packaging Cost / Unit (₹)
                </Label>
                <Input
                  id="packagingCost"
                  type="number"
                  step="any"
                  placeholder="e.g. 5"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="otherCost" className="text-xs font-medium">
                  Other Cost / Unit (₹)
                </Label>
                <Input
                  id="otherCost"
                  type="number"
                  step="any"
                  placeholder="e.g. 2"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Live Total preview */}
            <div className="p-3 rounded-lg border border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="font-semibold text-xs text-foreground">
                  Total Seller Cost Per Unit:
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-primary">
                {isAllFilled ? `₹${totalPreview.toLocaleString("en-IN")}` : "Incomplete"}
              </span>
            </div>

            {/* Effective Period Scope Selection */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-medium">Cost Application Scope</Label>
              <Select
                value={applyScope}
                onValueChange={(val: CostApplyScope) => setApplyScope(val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all-history">
                    Apply to all historical reports (Universal)
                  </SelectItem>
                  <SelectItem value="now">
                    Apply from now onward (Current Month)
                  </SelectItem>
                  <SelectItem value="selected-period">
                    Apply from specific date (Historical change)
                  </SelectItem>
                </SelectContent>
              </Select>

              {applyScope === "selected-period" && (
                <div className="space-y-1.5 mt-2">
                  <Label htmlFor="effectiveDate" className="text-[11px] text-muted-foreground">
                    Effective Date (YYYY-MM-DD)
                  </Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-medium">
                Optional Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. Supplier price update or packaging box change"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending}
              className="text-xs gap-1.5 cursor-pointer"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save & Recalculate Profit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
