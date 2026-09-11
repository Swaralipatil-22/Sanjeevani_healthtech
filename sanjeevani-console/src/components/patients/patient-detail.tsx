"use client";

import dayjs from "dayjs";
import _ from "lodash";
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  MapPinIcon,
  PencilIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Patient } from "@/types";

import GlobalToolbar from "@/components/common/global-toolbar";
import { PageError } from "@/components/common/page-error";
import {
  EncounterStatusChip,
  SeverityChip,
  VisitTypeChip,
} from "@/components/common/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CHIPS_FILLED } from "@/constants/global/colors";
import {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
  PERMISSION_MODULES,
  PERMISSION_SUB_MODULES,
  PERMISSIONS,
} from "@/constants/global/enums";
import { ROUTES } from "@/constants/global/routes";
import { getPatientDetails } from "@/lib/apis/client";
import { PermissionGate } from "@/lib/permissions/components";
import { getErrorMessage } from "@/store/setup-axios";

export default function PatientDetail() {
  const parameters = useParams();
  const router = useRouter();
  const patientId = String(_.get(parameters, "id", ""));

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPatient = async (): Promise<void> => {
      try {
        setError(null);
        const response = await getPatientDetails(patientId);
        setPatient(_.get(response, "data.data"));
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setIsLoading(false);
      }
    };

    void loadPatient();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 rounded" />
        <Skeleton className="h-40 rounded" />
        <Skeleton className="h-80 rounded" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <PageError
        detail={error ?? "Patient not found."}
        onRetry={() => router.refresh()}
      />
    );
  }

  const encounters = patient.encounters ?? [];

  return (
    <>
      <GlobalToolbar
        icon={UserRoundIcon}
        title={patient.patient_code}
        subTitle={`${patient.age} years · ${_.capitalize(patient.gender)} · ${patient.district}, ${patient.state}`}
        cta={
          <div className="flex items-center gap-x-2">
            <Button variant="outline" size="lg" asChild>
              <Link href={ROUTES.PATIENTS.LIST}>
                <ArrowLeftIcon className="size-3.5" />
                Back
              </Link>
            </Button>

            <PermissionGate
              module={PERMISSION_MODULES.PATIENT_MANAGEMENT}
              subModule={PERMISSION_SUB_MODULES.PATIENTS_MANAGEMENT}
              permissions={[PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED]}
            >
              <Button size="lg" asChild>
                <Link href={`${ROUTES.PATIENTS.MANAGEMENT}/${patient.id}`}>
                  <PencilIcon className="size-3.5" />
                  Update
                </Link>
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {/* SUMMARY STARTS */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mb-6 lg:grid-cols-4">
        {[
          {
            icon: MapPinIcon,
            label: "Facility",
            value: _.get(patient, "facility_details.name", "—"),
            hint: _.get(patient, "facility_details.district", ""),
          },
          {
            icon: CalendarClockIcon,
            label: "Registered",
            value: dayjs(patient.created_at).format("DD MMM YYYY"),
            hint: `${dayjs().diff(dayjs(patient.created_at), "day")} days ago`,
          },
          {
            icon: UserRoundIcon,
            label: "Encounters",
            value: String(encounters.length),
            hint: encounters[0]
              ? `Last seen ${dayjs(encounters[0].encounter_date).format("DD MMM YYYY")}`
              : "No visits recorded",
          },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded border p-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[10px] tracking-wide uppercase">
              <item.icon className="size-3" />
              {item.label}
            </div>
            <div className="truncate text-sm font-medium">{item.value}</div>
            {item.hint && (
              <div className="text-muted-foreground mt-0.5 truncate text-[10px]">
                {item.hint}
              </div>
            )}
          </div>
        ))}

        <div className="bg-card rounded border p-4">
          <div className="text-muted-foreground mb-2 text-[10px] tracking-wide uppercase">
            Chronic conditions
          </div>
          {patient.chronic_conditions.length === 0 ? (
            <span className="text-muted-foreground text-xs">None recorded</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {patient.chronic_conditions.map((condition) => (
                <span key={condition} className={CHIPS_FILLED.AMBER}>
                  {condition}
                </span>
              ))}
            </div>
          )}
          {patient.is_pregnant && (
            <Badge variant="secondary" className="mt-2 h-4 px-1.5 text-[9px]">
              ANTENATAL
            </Badge>
          )}
        </div>
      </div>
      {/* SUMMARY ENDS */}

      {/* HISTORY STARTS */}
      <section className="bg-card rounded border p-5">
        <h2 className="mb-1 text-xs font-semibold">Encounter history</h2>
        <p className="text-muted-foreground mb-5 text-[10px]">
          Most recent 20 visits recorded against this patient code
        </p>

        {encounters.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-[11px]">
            No encounters recorded yet.
          </div>
        ) : (
          <ol className="border-border relative ml-2 border-l">
            {encounters.map((encounter) => (
              <li key={encounter.id} className="mb-6 ml-5 last:mb-0">
                <span className="bg-primary absolute -left-[4.5px] mt-1.5 size-2 rounded-full" />

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={ROUTES.ENCOUNTERS.DETAILS(encounter.id)}
                    className="text-xs font-medium"
                  >
                    {dayjs(encounter.encounter_date).format("DD MMM YYYY, HH:mm")}
                  </Link>
                  <SeverityChip
                    value={encounter.severity as ENCOUNTER_SEVERITY}
                  />
                  <EncounterStatusChip
                    value={encounter.status as ENCOUNTER_STATUS}
                  />
                  <VisitTypeChip
                    value={encounter.visit_type as ENCOUNTER_VISIT_TYPES}
                  />
                </div>

                <div className="mt-1.5 text-xs font-medium">
                  {encounter.diagnosis}
                </div>
                <div className="text-muted-foreground mt-0.5 text-[11px]">
                  {_.get(encounter, "diagnosis_category_details.name", "—")} ·
                  seen by {_.get(encounter, "clinician_details.first_name", "")}{" "}
                  {_.get(encounter, "clinician_details.last_name", "")}
                </div>

                {encounter.treatment && (
                  <p className="text-muted-foreground mt-1.5 max-w-2xl text-[11px] leading-relaxed">
                    {encounter.treatment}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
      {/* HISTORY ENDS */}
    </>
  );
}
