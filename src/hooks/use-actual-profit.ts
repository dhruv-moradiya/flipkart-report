import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  BusinessProfitOverviewData,
  FinancialBasis,
  PeriodComparisonData,
  PeriodInfo,
  SkuPerformanceData,
  SnapshotDrilldownData,
  UnitBasis,
} from "@/types/profit-analytics.types";

export function useActualProfitOverview(
  periodFilter: string = "all-time",
  financialBasis: FinancialBasis = "netEarnings",
  unitBasis: UnitBasis = "netUnits"
) {
  return useQuery<BusinessProfitOverviewData>({
    queryKey: ["actual-profit-overview", periodFilter, financialBasis, unitBasis],
    queryFn: async () => {
      const res = await apiClient.get("/api/analytics/actual-profit", {
        params: { periodFilter, financialBasis, unitBasis },
      });
      return res.data.data;
    },
  });
}

export function useAvailablePeriods() {
  return useQuery<PeriodInfo[]>({
    queryKey: ["available-periods"],
    queryFn: async () => {
      const res = await apiClient.get("/api/analytics/periods");
      return res.data.data;
    },
  });
}

export function useSkuHistoricalPerformance(
  sku: string,
  financialBasis: FinancialBasis = "netEarnings",
  unitBasis: UnitBasis = "netUnits"
) {
  return useQuery<SkuPerformanceData>({
    queryKey: ["sku-performance", sku, financialBasis, unitBasis],
    queryFn: async () => {
      const res = await apiClient.get(`/api/analytics/sku/${encodeURIComponent(sku)}`, {
        params: { financialBasis, unitBasis },
      });
      return res.data.data;
    },
    enabled: Boolean(sku),
  });
}

export function usePeriodComparison(
  periodA: string,
  periodB: string,
  financialBasis: FinancialBasis = "netEarnings",
  unitBasis: UnitBasis = "netUnits"
) {
  return useQuery<PeriodComparisonData>({
    queryKey: ["period-comparison", periodA, periodB, financialBasis, unitBasis],
    queryFn: async () => {
      const res = await apiClient.get("/api/analytics/compare", {
        params: { periodA, periodB, financialBasis, unitBasis },
      });
      return res.data.data;
    },
    enabled: Boolean(periodA && periodB),
  });
}

export function useSnapshotDrilldown(snapshotId: string | null) {
  return useQuery<SnapshotDrilldownData>({
    queryKey: ["snapshot-drilldown", snapshotId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/analytics/drilldown/${snapshotId}`);
      return res.data.data;
    },
    enabled: Boolean(snapshotId),
  });
}

export function useRecalculateAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/analytics/recalculate");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actual-profit-overview"] });
      queryClient.invalidateQueries({ queryKey: ["sku-performance"] });
      queryClient.invalidateQueries({ queryKey: ["period-comparison"] });
    },
  });
}
