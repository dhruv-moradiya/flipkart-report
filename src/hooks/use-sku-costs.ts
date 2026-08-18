import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  SaveSkuCostInput,
  SkuCostOverviewItem,
  SkuCostProfileItem,
} from "@/types/sku-cost.types";

export function useAllSkuCosts() {
  return useQuery<SkuCostOverviewItem[]>({
    queryKey: ["all-sku-costs"],
    queryFn: async () => {
      const res = await apiClient.get("/api/sku-costs");
      return res.data.data;
    },
  });
}

export function useSkuCostProfiles(sku: string) {
  return useQuery<{
    current: SkuCostProfileItem | null;
    history: SkuCostProfileItem[];
  }>({
    queryKey: ["sku-cost-profiles", sku],
    queryFn: async () => {
      const res = await apiClient.get(`/api/sku-costs/${encodeURIComponent(sku)}`);
      return res.data;
    },
    enabled: Boolean(sku),
  });
}

export function useSaveSkuCostProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveSkuCostInput) => {
      const res = await apiClient.post(`/api/sku-costs/${encodeURIComponent(input.sku)}`, input);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["all-sku-costs"] });
      queryClient.invalidateQueries({ queryKey: ["sku-cost-profiles", variables.sku] });
      queryClient.invalidateQueries({ queryKey: ["actual-profit-overview"] });
      queryClient.invalidateQueries({ queryKey: ["sku-performance", variables.sku] });
      queryClient.invalidateQueries({ queryKey: ["period-comparison"] });
    },
  });
}
