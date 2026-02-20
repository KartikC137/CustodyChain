export interface dateFilters {
  min: string | undefined;
  on: string | undefined;
  max: string | undefined;
}

export const statusFilterKey = ["All", "Active", "Discontinued"] as const;
export const ownershipFilterKey = [
  "all",
  "created",
  "received",
  "transferred",
] as const;
export const customDateFilterKey = ["ON", "BEFORE", "AFTER", "FROM"] as const;
export const quickDateFilters = [
  "Today",
  "Last 7 Days",
  "Last 30 days",
  "Last 3 months",
  "Last 6 months",
  "2026",
] as const;

export type statusFilterType = (typeof statusFilterKey)[number];
export type ownershipFilterType = (typeof ownershipFilterKey)[number];
export type customDateFilterType = (typeof customDateFilterKey)[number];
export type quickDateFiltersKey = (typeof quickDateFilters)[number];
