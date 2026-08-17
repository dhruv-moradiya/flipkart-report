import { CrossReportView } from "@/features/analytics/routes/cross-report-view";

export const metadata = {
  title: "Cross-Report Correlation Analytics | Flipkart Seller Intelligence",
  description: "Cross-report scatter correlations between sales, net earnings, return rates, and cancellations.",
};

export default function AnalyticsCrossReportPage() {
  return <CrossReportView />;
}
