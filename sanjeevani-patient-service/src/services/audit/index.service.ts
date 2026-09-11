import type { Request } from "express";

import _ from "lodash";

import type { AUDIT_ACTIONS, AUDIT_STATUS } from "@/types/index.js";

import { Repositories } from "@/components/repositories/index.js";
import { Logger } from "@/logger/index.js";
import { getClientIp, getUserAgent } from "@/utils/common.js";

interface AuditEntry {
  action: AUDIT_ACTIONS;
  entity_type: string;
  entity_id?: string | null;
  status: AUDIT_STATUS;
  metadata?: Record<string, unknown>;
  actor_email?: string | null;
  user_id?: string | null;
}

export const AuditService = {
  /**
   * Fire-and-forget by design: an audit write must never fail the clinical
   * operation that triggered it. Failures are logged, not propagated.
   */
  record: async (request: Request, entry: AuditEntry): Promise<void> => {
    try {
      await Repositories.AuditLogsRepository.create({
        user_id: entry.user_id ?? _.get(request, "decoded_user.id", null),
        actor_email:
          entry.actor_email ?? _.get(request, "decoded_user.email", null),
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id ?? null,
        status: entry.status,
        ip_address: getClientIp(request),
        user_agent: _.truncate(getUserAgent(request), { length: 500 }),
        request_id: request.request_id,
        metadata: entry.metadata ?? {},
      } as never);
    } catch (error) {
      Logger.error(
        { error, action: entry.action, request_id: request.request_id },
        "Failed to write audit log entry.",
      );
    }
  },
};
