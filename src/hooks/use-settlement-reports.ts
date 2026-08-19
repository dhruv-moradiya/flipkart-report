import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { SettlementReportData } from "@/features/reports/types/report.types";

export function useSettlementReportData(reportId?: string) {
  return useQuery<SettlementReportData>({
    queryKey: ["settlement-report", reportId],
    queryFn: async () => {
      if (!reportId) throw new Error("No reportId provided");
      const res = await apiClient.get(`/api/reports/settlement/${reportId}/data`);
      return res.data.data;
    },
    enabled: Boolean(reportId),
    staleTime: 5 * 60 * 1000,
  });
}
