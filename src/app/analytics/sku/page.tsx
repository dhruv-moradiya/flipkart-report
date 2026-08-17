import { SkuView } from "@/features/analytics/routes/sku-view";

export const metadata = {
  title: "SKU Performance Analytics | Flipkart Seller Intelligence",
  description: "Detailed SKU-level earnings, sales revenue, expense magnitude, and return rates.",
};

export default function AnalyticsSkuPage() {
  return <SkuView />;
}
