import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PnlReportImportItem } from "@/types/sku-cost.types";

export function useReportImports() {
  return useQuery<PnlReportImportItem[]>({
    queryKey: ["report-imports"],
    queryFn: async () => {
      const res = await apiClient.get("/api/reports");
      return res.data.data;
    },
  });
}

export function useCheckDuplicateReport() {
  return useMutation({
    mutationFn: async (params: {
      fileName: string;
      fileHash?: string;
      metadata?: Record<string, unknown>;
      userSelectedMonth?: number;
      userSelectedYear?: number;
    }) => {
      const res = await apiClient.post("/api/reports/check-duplicate", params);
      return res.data.data;
    },
  });
}

export function useImportPnlReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      fileName: string;
      fileHash?: string;
      reportingPeriod?: string;
      userSelectedMonth?: number;
      userSelectedYear?: number;
      summaryMetadata?: Record<string, unknown>;
      skuRecords: unknown[];
      orderRecords: unknown[];
      replaceExisting?: boolean;
    }) => {
      const res = await apiClient.post("/api/reports/import", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-imports"] });
      queryClient.invalidateQueries({ queryKey: ["actual-profit-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-sku-costs"] });
      queryClient.invalidateQueries({ queryKey: ["available-periods"] });
    },
  });
}

export function useImportReturnsReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      fileName: string;
      fileHash?: string;
      reportingPeriod?: string;
      userSelectedMonth?: number;
      userSelectedYear?: number;
      summaryMetadata?: Record<string, unknown>;
      returnRecords: unknown[];
      replaceExisting?: boolean;
    }) => {
      const res = await apiClient.post("/api/reports/returns/import", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-imports"] });
      queryClient.invalidateQueries({ queryKey: ["available-periods"] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/reports/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-imports"] });
      queryClient.invalidateQueries({ queryKey: ["actual-profit-overview"] });
      queryClient.invalidateQueries({ queryKey: ["available-periods"] });
    },
  });
}

export function useReprocessReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/api/reports/${id}/reprocess`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-imports"] });
      queryClient.invalidateQueries({ queryKey: ["actual-profit-overview"] });
      queryClient.invalidateQueries({ queryKey: ["sku-performance"] });
    },
  });
}
