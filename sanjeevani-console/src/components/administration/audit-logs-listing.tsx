"use client";

import type { SortingState } from "@tanstack/react-table";

import dayjs from "dayjs";
import _ from "lodash";
import { ScrollTextIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { DataTableColumn } from "@/components/common/table";
import type { AuditLogFilter } from "@/lib/apis/client/auditlogs";
import type { AuditLog } from "@/types";

import GlobalToolbar from "@/components/common/global-toolbar";
import MultiSelectFilter from "@/components/common/multi-select-filter";
import { PageError } from "@/components/common/page-error";
import DataTable from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { AUDIT_STATUS_CHIPS, CHIPS_FILLED } from "@/constants/global/colors";
import {
  EXPORT_FORMATS,
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/constants/global/enums";
import { exportAuditLogs, listAuditLogs } from "@/lib/apis/client";
import { AccessDenied, PermissionGate } from "@/lib/permissions/components";
import { getErrorMessage } from "@/store/setup-axios";
import { humanise } from "@/lib/utils";
import { downloadBlobResponse } from "@/utils/download";
import { toApiSort } from "@/utils/table";

const ACTION_OPTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "CREATE_PATIENT",
  "UPDATE_PATIENT",
  "CREATE_ENCOUNTER",
  "UPDATE_ENCOUNTER",
  "DELETE_ENCOUNTER",
  "PERMISSION_DENIED",
  "EXPORT_DATA",
  "VIEW_ANALYTICS",
].map((value) => ({ label: humanise(value), value }));

const STATUS_OPTIONS = ["SUCCESS", "DENIED", "FAILURE"].map((value) => ({
  label: humanise(value),
  value,
}));

export default function AuditLogsListing() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      filter: { ...filter, ...(search ? { search } : {}) },
      page,
      limit,
      sort: toApiSort(sorting),
    }),
    [filter, search, page, limit, sorting],
  );

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const response = await listAuditLogs(payload);
      setRows(_.get(response, "data.data.data", []));
      setCount(_.get(response, "data.data.count", 0));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [payload]);

  useEffect(() => {
    const timer = setTimeout(() => void fetchLogs(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchLogs, search]);

  const handleExport = async (format: EXPORT_FORMATS): Promise<void> => {
    try {
      const response = await exportAuditLogs({
        ...payload,
        export_format: format,
      });
      downloadBlobResponse(response, "audit-logs", format);
      toast.success(`Audit trail exported as ${format}.`);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  const columns: DataTableColumn<AuditLog>[] = [
    {
      id: "created_at",
      header: "Timestamp",
      enable_sorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {dayjs(row.original.created_at).format("DD MMM YYYY")}
          </span>
          <span className="text-muted-foreground text-[10px] tabular-nums">
            {dayjs(row.original.created_at).format("HH:mm:ss")}
          </span>
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      enable_sorting: true,
      cell: ({ row }) => (
        <span className={CHIPS_FILLED.GREY}>{humanise(row.original.action)}</span>
      ),
    },
    {
      id: "status",
      header: "Result",
      enable_sorting: true,
      cell: ({ row }) => (
        <span
          className={
            AUDIT_STATUS_CHIPS[row.original.status] ?? CHIPS_FILLED.GREY
          }
        >
          {humanise(row.original.status)}
        </span>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.actor_email ?? "—"}</span>
          <span className="text-muted-foreground text-[10px]">
            {_.get(row.original, "user_details.employee_id", "—")}
          </span>
        </div>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{humanise(row.original.entity_type)}</span>
          <span className="text-muted-foreground text-[10px]">
            {row.original.entity_id ?? "—"}
          </span>
        </div>
      ),
    },
    {
      id: "ip_address",
      header: "Source",
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {row.original.ip_address ?? "—"}
        </span>
      ),
    },
    {
      id: "metadata",
      header: "Context",
      cell: ({ row }) =>
        _.isEmpty(row.original.metadata) ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <code className="text-muted-foreground block max-w-72 truncate text-[10px]">
            {JSON.stringify(row.original.metadata)}
          </code>
        ),
    },
  ];

  return (
    <PermissionGate
      module={PERMISSION_MODULES.ADMINISTRATION}
      subModule={PERMISSION_SUB_MODULES.AUDIT_LOGS}
      permissions={[PERMISSIONS.READ_ALL]}
      fallback={<AccessDenied />}
    >
      <GlobalToolbar
        icon={ScrollTextIcon}
        title="Audit Trail"
        subTitle="Append-only record of every sign-in, clinical change, export and denied request"
        searchValue={search}
        searchPlaceholder="Search actor or entity"
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          setIsRefreshing(true);
          void fetchLogs();
        }}
        onExport={(format) => void handleExport(format)}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen((previous) => !previous)}
      />

      {isFilterOpen && (
        <div className="bg-card mb-4 rounded border p-4 lg:mb-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-primary text-[12px] font-semibold">
              Refine results
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPage(1);
                setFilter({});
              }}
            >
              Reset all
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MultiSelectFilter
              label="Action"
              options={ACTION_OPTIONS}
              selected={filter.action ?? []}
              onChange={(action) => {
                setPage(1);
                setFilter({ ...filter, action });
              }}
            />

            <MultiSelectFilter
              label="Result"
              options={STATUS_OPTIONS}
              selected={filter.status ?? []}
              onChange={(status) => {
                setPage(1);
                setFilter({ ...filter, status });
              }}
            />
          </div>
        </div>
      )}

      {error ? (
        <PageError
          detail={error}
          onRetry={() => {
            setIsLoading(true);
            void fetchLogs();
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          totalCount={count}
          page={page}
          limit={limit}
          isLoading={isLoading}
          sorting={sorting}
          emptyTitle="No audit entries"
          emptyDescription="Activity across the platform will be recorded here."
          onSortingChange={(next) => {
            setPage(1);
            setSorting(next);
          }}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setPage(1);
            setLimit(next);
          }}
        />
      )}
    </PermissionGate>
  );
}
