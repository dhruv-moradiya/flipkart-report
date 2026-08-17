import { ProductsView } from "@/features/analytics/routes/products-view";

export const metadata = {
  title: "Product Analytics | Flipkart Seller Intelligence",
  description: "Catalog product sales, customer returns (RVP), cancellations, and logistics returns (RTO).",
};

export default function AnalyticsProductsPage() {
  return <ProductsView />;
}
