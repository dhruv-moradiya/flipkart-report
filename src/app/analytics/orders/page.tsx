import { OrdersView } from "@/features/analytics/routes/orders-view";

export const metadata = {
  title: "Orders Analytics | Flipkart Seller Intelligence",
  description: "Order status distribution, fulfillment models, payment modes, and order values.",
};

export default function AnalyticsOrdersPage() {
  return <OrdersView />;
}
