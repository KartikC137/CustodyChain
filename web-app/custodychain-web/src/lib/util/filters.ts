export interface dateFilters {
  min: string | undefined;
  on: string | undefined;
  max: string | undefined;
}

export const statusFilterKey = ["All", "Active", "Archived"] as const;
export const baseActTypeFilterKey = [
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
  "Custom Date",
] as const;

export type statusFilterType = (typeof statusFilterKey)[number];
export type baseActTypeFilterType = (typeof baseActTypeFilterKey)[number];
export type customDateFilterType = (typeof customDateFilterKey)[number];
export type quickDateFiltersKey = (typeof quickDateFilters)[number];
