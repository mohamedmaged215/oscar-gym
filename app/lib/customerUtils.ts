export function calculateEndDate(startDate: string, durationDays: number): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + durationDays);
  return start.toISOString().split("T")[0];
}

export function calculateStatus(
  endDate: string,
  subscriptionType?: string
): "active" | "expiring" | "expired" | "session" {
  if (subscriptionType === "session") return "session";

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "expiring";
  return "active";
}
