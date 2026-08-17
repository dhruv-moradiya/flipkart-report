import { ReturnsView } from "@/features/analytics/routes/returns-view";

export const metadata = {
  title: "Returns Analytics | Flipkart Seller Intelligence",
  description: "Detailed reverse logistics root-cause analysis, return reasons, sub-reasons, and timeline.",
};

export default function AnalyticsReturnsPage() {
  return <ReturnsView />;
}
