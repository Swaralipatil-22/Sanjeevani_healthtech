"use client";

import type { SortingState } from "@tanstack/react-table";

import dayjs from "dayjs";
import _ from "lodash";
import {
  EllipsisVerticalIcon,
  MoveRightIcon,
  PencilIcon,
  StethoscopeIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { DataTableColumn } from "@/components/common/table";
import type { EncounterFilter } from "@/lib/apis/client/encounters";
import type { Encounter } from "@/types";

import { PageError } from "@/components/common/page-error";
import {
  EncounterStatusChip,
  SeverityChip,
  VisitTypeChip,
} from "@/components/common/status-chip";
import DataTable from "@/components/common/table";
import GlobalToolbar from "@/components/common/global-toolbar";
import EncounterFilters from "@/components/encounters/encounter-filters";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
  EXPORT_FORMATS,
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/constants/global/enums";
import { ROUTES } from "@/constants/global/routes";
import {
  deleteEncounter,
  exportEncounters,
  listEncounters,
} from "@/lib/apis/client";
import { AccessDenied, PermissionGate } from "@/lib/permissions/components";
import { useHasPermission } from "@/lib/permissions/hooks";
import { getErrorMessage } from "@/store/setup-axios";
import { downloadBlobResponse } from "@/utils/download";
import { toApiSort } from "@/utils/table";

const DEFAULT_LIMIT = 10;

export default function EncountersListing() {
  const canWrite = useHasPermission(
    PERMISSION_MODULES.PATIENT_MANAGEMENT,
    PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT,
    [PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED],
  );

  const [rows, setRows] = useState<Encounter[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EncounterFilter>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "encounter_date", desc: true },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<Encounter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const payload = useMemo(
    () => ({
      filter: { ...filter, ...(search ? { search } : {}) },
      page,
      limit,
      sort: toApiSort(sorting),
    }),
    [filter, search, page, limit, sorting],
  );

  const fetchEncounters = useCallback(async () => {
    try {
      setError(null);
      const response = await listEncounters(payload);
      setRows(_.get(response, "data.data.data", []));
      setCount(_.get(response, "data.data.count", 0));
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [payload]);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => void fetchEncounters(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchEncounters, search]);

  const handleExport = async (format: EXPORT_FORMATS): Promise<void> => {
    try {
      const response = await exportEncounters({ ...payload, export_format: format });
      downloadBlobResponse(response, "encounters", format);
      toast.success(`Encounters exported as ${format}.`);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!pendingDeletion) return;

    try {
      setIsDeleting(true);
      await deleteEncounter(pendingDeletion.id);
      toast.success("Encounter removed.");
      setPendingDeletion(null);
      void fetchEncounters();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Encounter>[] = [
    {
      id: "encounter_date",
      header: "Encounter",
      enable_sorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Link
            href={ROUTES.ENCOUNTERS.DETAILS(row.original.id)}
            className="text-foreground hover:text-primary font-medium"
          >
            {dayjs(row.original.encounter_date).format("DD MMM YYYY")}
          </Link>
          <span className="text-muted-foreground text-[10px]">
            {dayjs(row.original.encounter_date).format("HH:mm")} ·{" "}
            {row.original.id}
          </span>
        </div>
      ),
    },
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {_.get(row.original, "patient_details.patient_code", "—")}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {_.get(row.original, "patient_details.age", "—")} yrs ·{" "}
            {_.capitalize(
              String(_.get(row.original, "patient_details.gender", "")),
            )}
          </span>
        </div>
      ),
    },
    {
      id: "diagnosis",
      header: "Diagnosis",
      cell: ({ row }) => (
        <div className="flex max-w-64 flex-col">
          <span className="truncate">{row.original.diagnosis}</span>
          <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
            {_.get(row.original, "diagnosis_category_details.name", "—")}
            {_.get(row.original, "diagnosis_category_details.is_notifiable") && (
              <Badge
                variant="destructive"
                className="h-3.5 px-1 text-[8px] font-bold"
              >
                NOTIFIABLE
              </Badge>
            )}
          </span>
        </div>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      enable_sorting: true,
      cell: ({ row }) => (
        <SeverityChip value={row.original.severity as ENCOUNTER_SEVERITY} />
      ),
    },
    {
      id: "status",
      header: "Status",
      enable_sorting: true,
      cell: ({ row }) => (
        <EncounterStatusChip value={row.original.status as ENCOUNTER_STATUS} />
      ),
    },
    {
      id: "visit_type",
      header: "Visit",
      cell: ({ row }) => (
        <VisitTypeChip
          value={row.original.visit_type as ENCOUNTER_VISIT_TYPES}
        />
      ),
    },
    {
      id: "clinician",
      header: "Clinician",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>
            {_.get(row.original, "clinician_details.first_name", "—")}{" "}
            {_.get(row.original, "clinician_details.last_name", "")}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {_.get(row.original, "facility_details.name", "—")}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      header_clx: "w-10",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Row actions">
              <EllipsisVerticalIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={ROUTES.ENCOUNTERS.DETAILS(row.original.id)}>
                <MoveRightIcon />
                View details
              </Link>
            </DropdownMenuItem>

            <PermissionGate
              module={PERMISSION_MODULES.PATIENT_MANAGEMENT}
              subModule={PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT}
              permissions={[PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED]}
            >
              <DropdownMenuItem asChild>
                <Link
                  href={`${ROUTES.ENCOUNTERS.MANAGEMENT}/${row.original.id}`}
                >
                  <PencilIcon />
                  Update
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => setPendingDeletion(row.original)}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </PermissionGate>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <PermissionGate
      module={PERMISSION_MODULES.PATIENT_MANAGEMENT}
      subModule={PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT}
      permissions={[PERMISSIONS.READ_ALL, PERMISSIONS.READ_OWNED]}
      fallback={<AccessDenied />}
    >
      <GlobalToolbar
        icon={StethoscopeIcon}
        title="Clinical Encounters"
        subTitle="Anonymised patient encounters recorded across outreach facilities"
        searchValue={search}
        searchPlaceholder="Search diagnosis or complaint"
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          setIsRefreshing(true);
          void fetchEncounters();
        }}
        onExport={(format) => void handleExport(format)}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen((previous) => !previous)}
        cta={
          canWrite ? (
            <Button size="lg" asChild>
              <Link href={ROUTES.ENCOUNTERS.MANAGEMENT}>
                Record Encounter
                <MoveRightIcon className="size-3.5" />
              </Link>
            </Button>
          ) : undefined
        }
      />

      {isFilterOpen && (
        <EncounterFilters
          value={filter}
          onChange={(next) => {
            setPage(1);
            setFilter(next);
          }}
          onReset={() => {
            setPage(1);
            setFilter({});
          }}
        />
      )}

      {error ? (
        <PageError
          detail={error}
          onRetry={() => {
            setIsLoading(true);
            void fetchEncounters();
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
          emptyTitle="No encounters recorded"
          emptyDescription="Encounters you record at the point of care will appear here."
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

      <AlertDialog
        open={Boolean(pendingDeletion)}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this encounter?</AlertDialogTitle>
            <AlertDialogDescription>
              The record for{" "}
              <span className="text-foreground font-medium">
                {_.get(pendingDeletion, "patient_details.patient_code", "")}
              </span>{" "}
              on{" "}
              {pendingDeletion
                ? dayjs(pendingDeletion.encounter_date).format("DD MMM YYYY")
                : ""}{" "}
              will be soft-deleted. It stays in the audit trail and can be
              restored by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="ghost" size="lg">
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              size="lg"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? <Spinner className="size-3.5" /> : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGate>
  );
}
