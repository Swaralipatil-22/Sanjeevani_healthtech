"use client";

import type { SortingState } from "@tanstack/react-table";

import dayjs from "dayjs";
import _ from "lodash";
import { UsersIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { DataTableColumn } from "@/components/common/table";
import type { UserFilter } from "@/lib/apis/client/users";
import type { UserProfile } from "@/types";

import GlobalToolbar from "@/components/common/global-toolbar";
import MultiSelectFilter from "@/components/common/multi-select-filter";
import { PageError } from "@/components/common/page-error";
import DataTable from "@/components/common/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  CHIPS_FILLED,
  ROLE_CHIPS,
  USER_STATUS_CHIPS,
} from "@/constants/global/colors";
import {
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
  USER_STATUS_TYPES,
} from "@/constants/global/enums";
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
} from "@/constants/global/labelvalues";
import { listUsers } from "@/lib/apis/client";
import { AccessDenied, PermissionGate } from "@/lib/permissions/components";
import { getInitials } from "@/lib/utils";
import { getErrorMessage } from "@/store/setup-axios";
import { toApiSort } from "@/utils/table";

export default function UsersListing() {
  const [rows, setRows] = useState<UserProfile[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>({});
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

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const response = await listUsers(payload);
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
    const timer = setTimeout(() => void fetchUsers(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  const columns: DataTableColumn<UserProfile>[] = [
    {
      id: "first_name",
      header: "Clinician",
      enable_sorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">
              {getInitials(row.original.first_name, row.original.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.first_name} {row.original.last_name}
            </span>
            <span className="text-muted-foreground text-[10px]">
              {row.original.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "employee_id",
      header: "Employee ID",
      enable_sorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.employee_id}</span>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = _.get(row.original, "role_details.name", "");
        return (
          <span className={ROLE_CHIPS[role] ?? CHIPS_FILLED.GREY}>
            {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
          </span>
        );
      },
    },
    {
      id: "facility",
      header: "Facility",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {_.get(row.original, "facility_details.name", "All facilities")}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      enable_sorting: true,
      cell: ({ row }) => (
        <span
          className={
            USER_STATUS_CHIPS[
              row.original.status as USER_STATUS_TYPES
            ] ?? CHIPS_FILLED.GREY
          }
        >
          {_.capitalize(String(row.original.status))}
        </span>
      ),
    },
    {
      id: "last_login_at",
      header: "Last sign-in",
      enable_sorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.last_login_at
            ? dayjs(row.original.last_login_at).format("DD MMM YYYY, HH:mm")
            : "Never"}
        </span>
      ),
    },
  ];

  return (
    <PermissionGate
      module={PERMISSION_MODULES.ADMINISTRATION}
      subModule={PERMISSION_SUB_MODULES.USERS_MANAGEMENT}
      permissions={[PERMISSIONS.READ_ALL]}
      fallback={<AccessDenied />}
    >
      <GlobalToolbar
        icon={UsersIcon}
        title="Platform Users"
        subTitle="Clinicians and administrators with access to the outreach network"
        searchValue={search}
        searchPlaceholder="Search name, email or ID"
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          setIsRefreshing(true);
          void fetchUsers();
        }}
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
              label="Role"
              options={ROLE_OPTIONS}
              selected={filter.role ?? []}
              onChange={(role) => {
                setPage(1);
                setFilter({ ...filter, role });
              }}
            />

            <MultiSelectFilter
              label="Status"
              options={USER_STATUS_OPTIONS}
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
            void fetchUsers();
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
          emptyTitle="No users found"
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
