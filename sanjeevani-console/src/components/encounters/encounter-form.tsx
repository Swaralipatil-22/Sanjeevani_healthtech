"use client";

import dayjs from "dayjs";
import { Formik } from "formik";
import _ from "lodash";
import { ArrowLeftIcon, MoveRightIcon, PlusIcon, StethoscopeIcon, XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { EncounterPayload } from "@/lib/apis/client/encounters";
import type { Patient } from "@/types";

import GlobalToolbar from "@/components/common/global-toolbar";
import {
  GlobalInput,
  GlobalSelect,
  GlobalTextarea,
} from "@/components/common/global-input";
import Stepper from "@/components/common/stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  ENCOUNTER_STEPS,
  EncounterSchemaStepMapper,
} from "@/constants/forms/schemas/encounters";
import {
  COMMON_SYMPTOMS,
  ENCOUNTER_INITIAL_DATA,
} from "@/constants/forms/schemas/encounters/initialdata";
import {
  ENCOUNTER_STATUS_OPTIONS,
  SEVERITY_OPTIONS,
  VISIT_TYPE_OPTIONS,
} from "@/constants/global/labelvalues";
import { ROUTES } from "@/constants/global/routes";
import {
  createEncounter,
  getEncounterDetails,
  listPatients,
  updateEncounter,
} from "@/lib/apis/client";
import { getErrorMessage } from "@/store/setup-axios";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const toNullableNumber = (value: string): number | null =>
  value === "" ? null : Number(value);

export default function EncounterForm() {
  const router = useRouter();
  const parameters = useParams();
  const encounterId = _.get(parameters, "id.0") as string | undefined;

  const facilities = useAppSelector((state) => state.masters.facilities);
  const categories = useAppSelector(
    (state) => state.masters.diagnosis_categories,
  );
  const profile = useAppSelector((state) => state.profile.data);

  const [activeStep, setActiveStep] = useState(0);
  const [entity, setEntity] = useState<EncounterPayload>({
    ...ENCOUNTER_INITIAL_DATA,
    facility_id: profile?.facility_id ?? "",
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(encounterId));
  const [symptomDraft, setSymptomDraft] = useState("");

  useEffect(() => {
    const loadPatients = async (): Promise<void> => {
      try {
        const response = await listPatients({ page: 1, limit: 1000 });
        setPatients(_.get(response, "data.data.data", []));
      } catch (caught) {
        toast.error(getErrorMessage(caught));
      }
    };

    void loadPatients();
  }, []);

  useEffect(() => {
    if (!encounterId) return;

    const loadEncounter = async (): Promise<void> => {
      try {
        const response = await getEncounterDetails(encounterId);
        const record = _.get(response, "data.data");

        setEntity({
          patient_id: _.get(record, "patient_id", ""),
          facility_id: _.get(record, "facility_id", ""),
          diagnosis_category_id: _.get(record, "diagnosis_category_id", ""),
          encounter_date: dayjs(_.get(record, "encounter_date")).format(
            "YYYY-MM-DDTHH:mm",
          ),
          visit_type: _.get(record, "visit_type", ""),
          chief_complaint: _.get(record, "chief_complaint", ""),
          symptoms: _.get(record, "symptoms", []),
          diagnosis: _.get(record, "diagnosis", ""),
          severity: _.get(record, "severity", ""),
          status: _.get(record, "status", ""),
          treatment: _.get(record, "treatment", ""),
          vitals: _.get(record, "vitals", {}),
          follow_up_date: _.get(record, "follow_up_date")
            ? dayjs(_.get(record, "follow_up_date")).format("YYYY-MM-DD")
            : null,
          notes: _.get(record, "notes", null),
        });
      } catch (caught) {
        toast.error(getErrorMessage(caught));
        router.push(ROUTES.ENCOUNTERS.LIST);
      } finally {
        setIsLoading(false);
      }
    };

    void loadEncounter();
  }, [encounterId, router]);

  const patientOptions = useMemo(
    () =>
      patients.map((patient) => ({
        label: `${patient.patient_code} · ${patient.age} yrs · ${_.capitalize(patient.gender)}`,
        value: patient.id,
      })),
    [patients],
  );

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-16 rounded" />
        <Skeleton className="h-96 rounded" />
      </div>
    );
  }

  return (
    <>
      <GlobalToolbar
        icon={StethoscopeIcon}
        title={encounterId ? "Update Encounter" : "Record Encounter"}
        subTitle={
          encounterId
            ? `Editing ${encounterId}`
            : "Capture a clinical encounter at the point of care"
        }
        cta={
          <Button variant="outline" size="lg" asChild>
            <a href={ROUTES.ENCOUNTERS.LIST}>
              <ArrowLeftIcon className="size-3.5" />
              Back
            </a>
          </Button>
        }
      />

      <div className="bg-card mx-auto flex max-w-3xl flex-col rounded border p-5">
        <Progress
          value={((activeStep + 1) / ENCOUNTER_STEPS.length) * 100}
          className="mt-1 mb-7"
        />
        <Stepper steps={ENCOUNTER_STEPS} activeStep={activeStep} />

        <Formik
          initialValues={entity}
          enableReinitialize
          validationSchema={EncounterSchemaStepMapper[activeStep]}
          onSubmit={async (values, helpers) => {
            // Intermediate steps only advance; the last one submits.
            if (activeStep < ENCOUNTER_STEPS.length - 1) {
              setEntity({ ...entity, ...values });
              setActiveStep((previous) => previous + 1);
              helpers.setSubmitting(false);
              helpers.setTouched({});
              return;
            }

            try {
              helpers.setSubmitting(true);
              const payload = { ...entity, ...values };

              if (encounterId) {
                await updateEncounter(encounterId, payload);
                toast.success("Encounter updated.");
              } else {
                await createEncounter(payload);
                toast.success("Encounter recorded.");
              }

              router.push(ROUTES.ENCOUNTERS.LIST);
              router.refresh();
            } catch (caught) {
              toast.error(getErrorMessage(caught));
            } finally {
              helpers.setSubmitting(false);
            }
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            isSubmitting,
          }) => (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* STEP 1 - VISIT STARTS */}
              {activeStep === 0 && (
                <div className="flex flex-col gap-4 rounded border p-5">
                  <div className="text-primary text-[12px] font-semibold">
                    Visit details
                  </div>

                  <GlobalSelect
                    id="patient_id"
                    label="Patient"
                    isRequired
                    value={values.patient_id}
                    options={patientOptions}
                    placeholder="Select a registered patient"
                    hint="Patients are identified by an anonymised code only."
                    errorMessage={touched.patient_id && errors.patient_id}
                    onValueChange={(value) =>
                      void setFieldValue("patient_id", value)
                    }
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <GlobalSelect
                      id="facility_id"
                      label="Facility"
                      isRequired
                      value={values.facility_id}
                      options={facilities.map((item) => ({
                        label: item.name,
                        value: item.id,
                      }))}
                      errorMessage={touched.facility_id && errors.facility_id}
                      onValueChange={(value) =>
                        void setFieldValue("facility_id", value)
                      }
                    />

                    <GlobalSelect
                      id="visit_type"
                      label="Visit type"
                      isRequired
                      value={values.visit_type}
                      options={VISIT_TYPE_OPTIONS}
                      errorMessage={touched.visit_type && errors.visit_type}
                      onValueChange={(value) =>
                        void setFieldValue("visit_type", value)
                      }
                    />
                  </div>

                  <GlobalInput
                    id="encounter_date"
                    name="encounter_date"
                    label="Encounter date and time"
                    isRequired
                    type="datetime-local"
                    max={dayjs().format("YYYY-MM-DDTHH:mm")}
                    value={values.encounter_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={
                      touched.encounter_date && errors.encounter_date
                    }
                  />

                  <GlobalTextarea
                    id="chief_complaint"
                    name="chief_complaint"
                    label="Chief complaint"
                    isRequired
                    rows={3}
                    placeholder="In the patient's own words, e.g. fever for three days"
                    value={values.chief_complaint}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={
                      touched.chief_complaint && errors.chief_complaint
                    }
                  />
                </div>
              )}
              {/* STEP 1 - VISIT ENDS */}

              {/* STEP 2 - CLINICAL STARTS */}
              {activeStep === 1 && (
                <div className="flex flex-col gap-4 rounded border p-5">
                  <div className="text-primary text-[12px] font-semibold">
                    Clinical assessment
                  </div>

                  {/* SYMPTOMS STARTS */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="symptom-draft">
                      Symptoms<span className="text-destructive">*</span>
                    </Label>

                    <div className="flex gap-2">
                      <Input
                        id="symptom-draft"
                        value={symptomDraft}
                        placeholder="Type a symptom and press Enter"
                        onChange={(event) => setSymptomDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          const next = symptomDraft.trim();
                          if (!next || _.includes(values.symptoms, next)) return;
                          void setFieldValue("symptoms", [
                            ...values.symptoms,
                            next,
                          ]);
                          setSymptomDraft("");
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          const next = symptomDraft.trim();
                          if (!next || _.includes(values.symptoms, next)) return;
                          void setFieldValue("symptoms", [
                            ...values.symptoms,
                            next,
                          ]);
                          setSymptomDraft("");
                        }}
                      >
                        <PlusIcon className="size-3.5" />
                      </Button>
                    </div>

                    {values.symptoms.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {values.symptoms.map((symptom) => (
                          <Badge
                            key={symptom}
                            variant="secondary"
                            className="h-6 gap-1 pr-1 pl-2"
                          >
                            {symptom}
                            <button
                              type="button"
                              aria-label={`Remove ${symptom}`}
                              onClick={() =>
                                void setFieldValue(
                                  "symptoms",
                                  values.symptoms.filter(
                                    (item) => item !== symptom,
                                  ),
                                )
                              }
                              className="hover:bg-foreground/10 rounded-full p-0.5"
                            >
                              <XIcon className="size-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {COMMON_SYMPTOMS.filter(
                        (item) => !_.includes(values.symptoms, item),
                      )
                        .slice(0, 8)
                        .map((symptom) => (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() =>
                              void setFieldValue("symptoms", [
                                ...values.symptoms,
                                symptom,
                              ])
                            }
                            className="text-muted-foreground hover:border-primary/40 hover:text-foreground rounded-sm border border-dashed px-2 py-0.5 text-[10px] transition-colors"
                          >
                            + {symptom}
                          </button>
                        ))}
                    </div>

                    {touched.symptoms && errors.symptoms && (
                      <span className="text-destructive text-[11px]">
                        {String(errors.symptoms)}
                      </span>
                    )}
                  </div>
                  {/* SYMPTOMS ENDS */}

                  <GlobalInput
                    id="diagnosis"
                    name="diagnosis"
                    label="Diagnosis"
                    isRequired
                    placeholder="e.g. Acute viral fever"
                    value={values.diagnosis}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={touched.diagnosis && errors.diagnosis}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <GlobalSelect
                      id="diagnosis_category_id"
                      label="Category"
                      isRequired
                      value={values.diagnosis_category_id}
                      options={categories.map((item) => ({
                        label: item.is_notifiable
                          ? `${item.name} (notifiable)`
                          : item.name,
                        value: item.id,
                      }))}
                      errorMessage={
                        touched.diagnosis_category_id &&
                        errors.diagnosis_category_id
                      }
                      onValueChange={(value) =>
                        void setFieldValue("diagnosis_category_id", value)
                      }
                    />

                    <GlobalSelect
                      id="severity"
                      label="Severity"
                      isRequired
                      value={values.severity}
                      options={SEVERITY_OPTIONS}
                      errorMessage={touched.severity && errors.severity}
                      onValueChange={(value) =>
                        void setFieldValue("severity", value)
                      }
                    />

                    <GlobalSelect
                      id="status"
                      label="Outcome"
                      isRequired
                      value={values.status}
                      options={ENCOUNTER_STATUS_OPTIONS}
                      errorMessage={touched.status && errors.status}
                      onValueChange={(value) =>
                        void setFieldValue("status", value)
                      }
                    />
                  </div>

                  {/* VITALS STARTS */}
                  <div className="rounded border p-4">
                    <div className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-wider uppercase">
                      Vitals (optional)
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          ["temperature_celsius", "Temp (°C)", "0.1"],
                          ["systolic_bp", "Systolic (mmHg)", "1"],
                          ["diastolic_bp", "Diastolic (mmHg)", "1"],
                          ["pulse_bpm", "Pulse (bpm)", "1"],
                          ["spo2_percentage", "SpO₂ (%)", "1"],
                          ["weight_kg", "Weight (kg)", "0.1"],
                        ] as const
                      ).map(([field, label, step]) => (
                        <GlobalInput
                          key={field}
                          id={field}
                          name={`vitals.${field}`}
                          label={label}
                          type="number"
                          step={step}
                          value={values.vitals[field] ?? ""}
                          onChange={(event) =>
                            void setFieldValue(
                              `vitals.${field}`,
                              toNullableNumber(event.target.value),
                            )
                          }
                          onBlur={handleBlur}
                          errorMessage={
                            _.get(touched, `vitals.${field}`) &&
                            (_.get(errors, `vitals.${field}`) as string)
                          }
                        />
                      ))}
                    </div>

                    {typeof errors.vitals === "string" && (
                      <span className="text-destructive mt-2 block text-[11px]">
                        {errors.vitals}
                      </span>
                    )}
                  </div>
                  {/* VITALS ENDS */}

                  <GlobalTextarea
                    id="treatment"
                    name="treatment"
                    label="Treatment plan"
                    isRequired
                    rows={4}
                    placeholder="Medication, dosage, duration and advice given"
                    value={values.treatment}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={touched.treatment && errors.treatment}
                  />
                </div>
              )}
              {/* STEP 2 - CLINICAL ENDS */}

              {/* STEP 3 - REVIEW STARTS */}
              {activeStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 rounded border p-5">
                    <div className="text-primary text-[12px] font-semibold">
                      Follow-up
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <GlobalInput
                        id="follow_up_date"
                        name="follow_up_date"
                        label="Follow-up date"
                        type="date"
                        min={dayjs(values.encounter_date)
                          .add(1, "day")
                          .format("YYYY-MM-DD")}
                        value={values.follow_up_date ?? ""}
                        onChange={(event) =>
                          void setFieldValue(
                            "follow_up_date",
                            event.target.value || null,
                          )
                        }
                        onBlur={handleBlur}
                        hint="Leave blank if no follow-up is needed."
                        errorMessage={
                          touched.follow_up_date && errors.follow_up_date
                        }
                      />
                    </div>

                    <GlobalTextarea
                      id="notes"
                      name="notes"
                      label="Additional notes"
                      rows={3}
                      placeholder="Counselling given, referral reason, social context"
                      value={values.notes ?? ""}
                      onChange={(event) =>
                        void setFieldValue("notes", event.target.value || null)
                      }
                      onBlur={handleBlur}
                      errorMessage={touched.notes && errors.notes}
                    />
                  </div>

                  <ReviewPanel
                    values={{ ...entity, ...values }}
                    patientLabel={
                      patientOptions.find(
                        (item) => item.value === values.patient_id,
                      )?.label ?? "—"
                    }
                    facilityLabel={
                      facilities.find((item) => item.id === values.facility_id)
                        ?.name ?? "—"
                    }
                    categoryLabel={
                      categories.find(
                        (item) => item.id === values.diagnosis_category_id,
                      )?.name ?? "—"
                    }
                  />
                </div>
              )}
              {/* STEP 3 - REVIEW ENDS */}

              {/* NAVIGATION STARTS */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((previous) => previous - 1)}
                >
                  <ArrowLeftIcon className="size-3.5" />
                  Back
                </Button>

                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <>
                      {activeStep === ENCOUNTER_STEPS.length - 1
                        ? encounterId
                          ? "Save changes"
                          : "Record encounter"
                        : "Continue"}
                      <MoveRightIcon className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
              {/* NAVIGATION ENDS */}
            </form>
          )}
        </Formik>
      </div>
    </>
  );
}

function ReviewPanel(props: {
  values: EncounterPayload;
  patientLabel: string;
  facilityLabel: string;
  categoryLabel: string;
}) {
  const rows: [string, string][] = [
    ["Patient", props.patientLabel],
    ["Facility", props.facilityLabel],
    [
      "Encounter",
      dayjs(props.values.encounter_date).format("DD MMM YYYY, HH:mm"),
    ],
    ["Visit type", _.startCase(_.toLower(props.values.visit_type))],
    ["Chief complaint", props.values.chief_complaint || "—"],
    ["Symptoms", props.values.symptoms.join(", ") || "—"],
    ["Diagnosis", props.values.diagnosis || "—"],
    ["Category", props.categoryLabel],
    ["Severity", _.startCase(_.toLower(props.values.severity))],
    ["Outcome", _.startCase(_.toLower(props.values.status))],
    ["Treatment", props.values.treatment || "—"],
    [
      "Follow-up",
      props.values.follow_up_date
        ? dayjs(props.values.follow_up_date).format("DD MMM YYYY")
        : "Not required",
    ],
  ];

  return (
    <div className="rounded border p-5">
      <div className="text-primary mb-4 text-[12px] font-semibold">
        Review before saving
      </div>

      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              "flex flex-col gap-0.5",
              index >= rows.length - 2 && "sm:col-span-2",
            )}
          >
            <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
              {label}
            </dt>
            <dd className="text-xs break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
