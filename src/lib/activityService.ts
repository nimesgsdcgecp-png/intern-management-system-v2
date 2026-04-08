import { hasuraMutation } from "@/lib/hasura";
import { LOG_ACTIVITY } from "@/lib/graphql/mutations";

export interface ActivityLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  metadata
}: ActivityLogParams) {
  try {
    await hasuraMutation(LOG_ACTIVITY, {
      userId,
      action,
      entityType,
      entityId,
      metadata
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw error to avoid breaking the main process
  }
}
