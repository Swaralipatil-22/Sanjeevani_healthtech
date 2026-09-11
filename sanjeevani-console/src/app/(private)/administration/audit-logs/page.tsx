import type { Metadata } from "next";

import AuditLogsListing from "@/components/administration/audit-logs-listing";

export const metadata: Metadata = { title: "Audit Trail" };

export default function AuditLogsPage() {
  return <AuditLogsListing />;
}
