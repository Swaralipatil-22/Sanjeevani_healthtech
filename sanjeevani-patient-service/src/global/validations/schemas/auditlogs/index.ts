import { Yup } from "@/global/validations/extensions/index.js";
import { buildGlobalFilterSchema } from "@/global/validations/schemas/common/index.js";
import { AUDIT_ACTIONS, AUDIT_STATUS } from "@/types/index.js";

export const AuditLogFilterSchema = Yup.object({
  search: Yup.string().trim().optional(),
  user_id: Yup.array().of(Yup.string()),
  action: Yup.array().of(Yup.string().oneOf(Object.values(AUDIT_ACTIONS))),
  status: Yup.array().of(Yup.string().oneOf(Object.values(AUDIT_STATUS))),
  entity_type: Yup.array().of(Yup.string()),
  from: Yup.string().validateDateTime().optional(),
  to: Yup.string().validateDateTime().optional(),
});

export const ListAuditLogsSchema =
  buildGlobalFilterSchema(AuditLogFilterSchema);
