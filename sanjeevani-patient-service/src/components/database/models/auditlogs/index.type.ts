import type { CreationOptional, InferAttributes, Model } from "sequelize";

import type { AUDIT_ACTIONS, AUDIT_STATUS } from "@/types/index.js";

export interface AuditLogAttributes
  extends Model<
    InferAttributes<AuditLogAttributes>,
    AuditLogCreationAttributes
  > {
  id: CreationOptional<string>;
  user_id: string | null;
  actor_email: string | null;
  action: AUDIT_ACTIONS;
  entity_type: string;
  entity_id: string | null;
  status: AUDIT_STATUS;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: CreationOptional<Date>;
}

export interface AuditLogCreationAttributes {
  id?: string;
  user_id?: string | null;
  actor_email?: string | null;
  action: AUDIT_ACTIONS;
  entity_type: string;
  entity_id?: string | null;
  status: AUDIT_STATUS;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  metadata?: Record<string, unknown>;
}
