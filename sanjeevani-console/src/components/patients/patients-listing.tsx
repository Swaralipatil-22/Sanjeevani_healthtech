"use client";

import type { SortingState } from "@tanstack/react-table";

import dayjs from "dayjs";
import _ from "lodash";
import {
  EllipsisVerticalIcon,
  MoveRightIcon,
  PencilIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { DataTableColumn } from "@/components/common/table";
import type { PatientFilter } from "@/lib/apis/client/patients";
import type { Patient } from "@/types";

import GlobalToolbar from "@/components/common/global-toolbar";
import MultiSelectFilter from "@/components/common/multi-select-filter";
import { PageError } from "@/components/common/page-error";
import DataTable from "@/components/common/table";
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
import { CHIPS_FILLED } from "@/constants/global/colors";
import {
  EXPORT_FORMATS,
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/constants/global/enums";
import { GENDER_OPTIONS } from "@/constants/global/labelvalues";
import { ROUTES } from "@/constants/global/routes";
import {
  deletePatient,
  exportPatients,
  listPatients,
} from "@/lib/apis/client";
import { AccessDenied, PermissionGate } from "@/lib/permissions/components";
import { useHasPermission } from "@/lib/permissions/hooks";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/store/setup-axios";
import { downloadBlobResponse } from "@/utils/download";
import { toApiSort } from "@/utils/table";

export default function PatientsListing() {
  const facilities = useAppSelector((state) => state.masters.facilities);

  const canWrite = useHasPermission(
    PERMISSION_MODULES.PATIENT_MANAGEMENT,
    PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT,
    [PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED],
  );

  const [rows, setRows] = useState<Patient[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PatientFilter>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<Patient | null>(null);
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

  const fetchPatients = useCallback(async () => {
    try {
      setError(null);
      const response = await listPatients(payload);
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
    const timer = setTimeout(() => void fetchPatients(), search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchPatients, search]);

  const handleExport = async (format: EXPORT_FORMATS): Promise<void> => {
    try {
      const response = await exportPatients({ ...payload, export_format: format });
      downloadBlobResponse(response, "patients", format);
      toast.success(`Patients exported as ${format}.`);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!pendingDeletion) return;

    try {
      setIsDeleting(true);
      await deletePatient(pendingDeletion.id);
      toast.success("Patient removed.");
      setPendingDeletion(null);
      void fetchPatients();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Patient>[] = [
    {
      id: "patient_code",
      header: "Patient code",
      enable_sorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.PATIENTS.DETAILS(row.original.id)}
            className="text-foreground hover:text-primary font-medium"
          >
            {row.original.patient_code}
          </Link>
          {row.original.is_pregnant && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              ANTENATAL
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "age",
      header: "Age",
      enable_sorting: true,
      cell: ({ row }) => <span>{row.original.age} yrs</span>,
    },
    {
      id: "gender",
      header: "Gender",
      enable_sorting: true,
      cell: ({ row }) => (
        <span className={CHIPS_FILLED.GREY}>
          {_.capitalize(row.original.gender)}
        </span>
      ),
    },
    {
      id: "district",
      header: "District",
      enable_sorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.district}</span>
          <span className="text-muted-foreground text-[10px]">
            {row.original.state}
          </span>
        </div>
      ),
    },
    {
      id: "facility",
      header: "Facility",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {_.get(row.original, "facility_details.name", "—")}
        </span>
      ),
    },
    {
      id: "chronic_conditions",
      header: "Chronic conditions",
      cell: ({ row }) =>
        row.original.chronic_conditions.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.original.chronic_conditions.map((condition) => (
              <span key={condition} className={CHIPS_FILLED.AMBER}>
                {condition}
              </span>
            ))}
          </div>
        ),
    },
    {
      id: "created_at",
      header: "Registered",
      enable_sorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {dayjs(row.original.created_at).format("DD MMM YYYY")}
        </span>
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
              <Link href={ROUTES.PATIENTS.DETAILS(row.original.id)}>
                <MoveRightIcon />
                View history
              </Link>
            </DropdownMenuItem>

            <PermissionGate
              module={PERMISSION_MODULES.PATIENT_MANAGEMENT}
              subModule={PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT}
              permissions={[PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED]}
            >
              <DropdownMenuItem asChild>
                <Link href={`${ROUTES.PATIENTS.MANAGEMENT}/${row.original.id}`}>
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
      subModule={PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT}
      permissions={[PERMISSIONS.READ_ALL, PERMISSIONS.READ_OWNED]}
      fallback={<AccessDenied />}
    >
      <GlobalToolbar
        icon={UsersRoundIcon}
        title="Patient Register"
        subTitle="Pseudonymised patient records - no names, contact numbers or identifiers"
        searchValue={search}
        searchPlaceholder="Search code or district"
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          setIsRefreshing(true);
          void fetchPatients();
        }}
        onExport={(format) => void handleExport(format)}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => setIsFilterOpen((previous) => !previous)}
        cta={
          canWrite ? (
            <Button size="lg" asChild>
              <Link href={ROUTES.PATIENTS.MANAGEMENT}>
                Register Patient
                <MoveRightIcon className="size-3.5" />
              </Link>
            </Button>
          ) : undefined
        }
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
              label="Gender"
              options={GENDER_OPTIONS}
              selected={filter.gender ?? []}
              onChange={(gender) => {
                setPage(1);
                setFilter({ ...filter, gender });
              }}
            />

            <MultiSelectFilter
              label="Facility"
              options={facilities.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
              selected={filter.facility_id ?? []}
              onChange={(facility_id) => {
                setPage(1);
                setFilter({ ...filter, facility_id });
              }}
            />

            <MultiSelectFilter
              label="District"
              options={_.uniq(facilities.map((item) => item.district)).map(
                (district) => ({ label: district, value: district }),
              )}
              selected={filter.district ?? []}
              onChange={(district) => {
                setPage(1);
                setFilter({ ...filter, district });
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
            void fetchPatients();
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
          emptyTitle="No patients registered"
          emptyDescription="Register a patient to start recording encounters against an anonymised code."
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
            <AlertDialogTitle>Remove this patient?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletion?.patient_code} will be soft-deleted. Patients
              with recorded encounters cannot be removed — their clinical
              history has to be preserved.
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
