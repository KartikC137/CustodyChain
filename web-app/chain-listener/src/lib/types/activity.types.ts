import { z } from "zod";

export const ActivityTypeSchema = z.enum([
  "create",
  "transfer",
  "discontinue",
  "fetch",
]);
export const ActivityStatusSchema = z.enum([
  "on_chain",
  "db_only",
  "client_only",
  "failed",
  "pending",
]);

export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;
export type ActivityTypeType = z.infer<typeof ActivityTypeSchema>;
