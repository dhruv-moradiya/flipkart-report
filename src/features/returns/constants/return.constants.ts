export const RETURN_TYPE_LABELS: Record<string, string> = {
  customer_return: "Customer Returns",
  courier_return: "Courier Returns",
  replacement: "Replacement",
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  in_transit: "In Transit",
  start: "Start",
  delivered: "Delivered",
  completed: "Completed",
  rejected: "Rejected",
  approved: "Approved",
  pending: "Pending",
  cancelled: "Cancelled",
  rto_initiated: "RTO Initiated",
};

export const COMPLETION_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  completed: "Completed",
};

export function formatReturnType(type: string): string {
  const normalized = type.toLowerCase().trim();
  return RETURN_TYPE_LABELS[normalized] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatReturnStatus(status: string): string {
  const normalized = status.toLowerCase().trim();
  return RETURN_STATUS_LABELS[normalized] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
