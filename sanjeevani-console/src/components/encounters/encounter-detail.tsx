"use client";

import dayjs from "dayjs";
import _ from "lodash";
import {
  ActivityIcon,
  ArrowLeftIcon,
  PencilIcon,
  StethoscopeIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Encounter } from "@/types";

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
import { getEncounterDetails } from "@/lib/apis/client";
import { PermissionGate } from "@/lib/permissions/components";
import { getErrorMessage } from "@/store/setup-axios";

const VITAL_LABELS: [keyof Encounter["vitals"], string, string][] = [
  ["temperature_celsius", "Temperature", "°C"],
  ["pulse_bpm", "Pulse", "bpm"],
  ["spo2_percentage", "SpO₂", "%"],
  ["weight_kg", "Weight", "kg"],
  ["blood_sugar_mgdl", "Blood sugar", "mg/dL"],
];

export default function EncounterDetail() {
  const parameters = useParams();
  const router = useRouter();
  const encounterId = String(_.get(parameters, "id", ""));

  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEncounter = async (): Promise<void> => {
      try {
        setError(null);
        const response = await getEncounterDetails(encounterId);
        setEncounter(_.get(response, "data.data"));
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setIsLoading(false);
      }
    };

    void loadEncounter();
  }, [encounterId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 rounded" />
        <Skeleton className="h-96 rounded" />
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <PageError
        detail={error ?? "Encounter not found."}
        onRetry={() => router.refresh()}
      />
    );
  }

  const bloodPressure =
    encounter.vitals.systolic_bp && encounter.vitals.diastolic_bp
      ? `${encounter.vitals.systolic_bp}/${encounter.vitals.diastolic_bp}`
      : null;

  return (
    <>
      <GlobalToolbar
        icon={StethoscopeIcon}
        title={dayjs(encounter.encounter_date).format("DD MMM YYYY, HH:mm")}
        subTitle={`${encounter.id} · ${_.get(encounter, "facility_details.name", "—")}`}
        cta={
          <div className="flex items-center gap-x-2">
            <Button variant="outline" size="lg" asChild>
              <Link href={ROUTES.ENCOUNTERS.LIST}>
                <ArrowLeftIcon className="size-3.5" />
                Back
              </Link>
            </Button>

            <PermissionGate
              module={PERMISSION_MODULES.PATIENT_MANAGEMENT}
              subModule={PERMISSION_SUB_MODULES.ENCOUNTERS_MANAGEMENT}
              permissions={[PERMISSIONS.WRITE_ALL, PERMISSIONS.WRITE_OWNED]}
            >
              <Button size="lg" asChild>
                <Link href={`${ROUTES.ENCOUNTERS.MANAGEMENT}/${encounter.id}`}>
                  <PencilIcon className="size-3.5" />
                  Update
                </Link>
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* CLINICAL STARTS */}
        <section className="bg-card flex flex-col gap-5 rounded border p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityChip value={encounter.severity as ENCOUNTER_SEVERITY} />
            <EncounterStatusChip
              value={encounter.status as ENCOUNTER_STATUS}
            />
            <VisitTypeChip
              value={encounter.visit_type as ENCOUNTER_VISIT_TYPES}
            />
            {_.get(encounter, "diagnosis_category_details.is_notifiable") && (
              <Badge variant="destructive" className="h-5 px-2 text-[9px]">
                NOTIFIABLE DISEASE
              </Badge>
            )}
          </div>

          {[
            ["Chief complaint", encounter.chief_complaint],
            ["Diagnosis", encounter.diagnosis],
            ["Treatment plan", encounter.treatment],
            ["Notes", encounter.notes ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                {label}
              </span>
              <p className="text-xs leading-relaxed">{value}</p>
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
              Symptoms
            </span>
            <div className="flex flex-wrap gap-1">
              {encounter.symptoms.length === 0 ? (
                <span className="text-muted-foreground text-xs">—</span>
              ) : (
                encounter.symptoms.map((symptom) => (
                  <span key={symptom} className={CHIPS_FILLED.TEAL}>
                    {symptom}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>
        {/* CLINICAL ENDS */}

        {/* SIDEBAR STARTS */}
        <div className="flex flex-col gap-4 lg:gap-6">
          <section className="bg-card rounded border p-5">
            <h2 className="mb-4 flex items-center gap-1.5 text-xs font-semibold">
              <ActivityIcon className="text-muted-foreground size-3.5" />
              Vitals
            </h2>

            <dl className="flex flex-col gap-2.5">
              {bloodPressure && (
                <div className="flex items-center justify-between text-xs">
                  <dt className="text-muted-foreground">Blood pressure</dt>
                  <dd className="font-semibold tabular-nums">
                    {bloodPressure}{" "}
                    <span className="text-muted-foreground font-normal">
                      mmHg
                    </span>
                  </dd>
                </div>
              )}

              {VITAL_LABELS.map(([key, label, unit]) => {
                const value = encounter.vitals[key];
                if (_.isNil(value)) return null;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between text-xs"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">
                      {value}{" "}
                      <span className="text-muted-foreground font-normal">
                        {unit}
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="bg-card rounded border p-5">
            <h2 className="mb-4 text-xs font-semibold">Record</h2>

            <dl className="flex flex-col gap-3">
              {[
                [
                  "Patient",
                  _.get(encounter, "patient_details.patient_code", "—"),
                ],
                [
                  "Clinician",
                  `${_.get(encounter, "clinician_details.first_name", "")} ${_.get(encounter, "clinician_details.last_name", "")}`.trim() ||
                    "—",
                ],
                ["Facility", _.get(encounter, "facility_details.name", "—")],
                [
                  "Category",
                  _.get(encounter, "diagnosis_category_details.name", "—"),
                ],
                [
                  "Follow-up",
                  encounter.follow_up_date
                    ? dayjs(encounter.follow_up_date).format("DD MMM YYYY")
                    : "Not required",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
                    {label}
                  </dt>
                  <dd className="text-xs">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        {/* SIDEBAR ENDS */}
      </div>
    </>
  );
}
