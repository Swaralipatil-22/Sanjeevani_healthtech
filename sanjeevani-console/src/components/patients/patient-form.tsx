"use client";

import { Formik } from "formik";
import _ from "lodash";
import {
  ArrowLeftIcon,
  MoveRightIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { PatientPayload } from "@/lib/apis/client/patients";

import {
  GlobalInput,
  GlobalSelect,
} from "@/components/common/global-input";
import GlobalToolbar from "@/components/common/global-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  COMMON_CHRONIC_CONDITIONS,
  PATIENT_INITIAL_DATA,
  PatientSchema,
} from "@/constants/forms/schemas/patients";
import { GENDER_TYPES } from "@/constants/global/enums";
import { GENDER_OPTIONS } from "@/constants/global/labelvalues";
import { ROUTES } from "@/constants/global/routes";
import {
  createPatient,
  getPatientDetails,
  updatePatient,
} from "@/lib/apis/client";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/store/setup-axios";

export default function PatientForm() {
  const router = useRouter();
  const parameters = useParams();
  const patientId = _.get(parameters, "id.0") as string | undefined;

  const facilities = useAppSelector((state) => state.masters.facilities);
  const profile = useAppSelector((state) => state.profile.data);

  const [entity, setEntity] = useState<PatientPayload>({
    ...PATIENT_INITIAL_DATA,
    facility_id: profile?.facility_id ?? "",
  });
  const [isLoading, setIsLoading] = useState(Boolean(patientId));

  useEffect(() => {
    if (!patientId) return;

    const loadPatient = async (): Promise<void> => {
      try {
        const response = await getPatientDetails(patientId);
        const record = _.get(response, "data.data");

        setEntity({
          age: _.get(record, "age", 0),
          gender: _.get(record, "gender", ""),
          district: _.get(record, "district", ""),
          state: _.get(record, "state", ""),
          facility_id: _.get(record, "facility_id", ""),
          chronic_conditions: _.get(record, "chronic_conditions", []),
          is_pregnant: _.get(record, "is_pregnant", false),
        });
      } catch (caught) {
        toast.error(getErrorMessage(caught));
        router.push(ROUTES.PATIENTS.LIST);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPatient();
  }, [patientId, router]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Skeleton className="h-16 rounded" />
        <Skeleton className="h-80 rounded" />
      </div>
    );
  }

  return (
    <>
      <GlobalToolbar
        icon={UserPlusIcon}
        title={patientId ? "Update Patient" : "Register Patient"}
        subTitle="Only pseudonymised demographics are stored - never a name or contact number"
        cta={
          <Button variant="outline" size="lg" asChild>
            <a href={ROUTES.PATIENTS.LIST}>
              <ArrowLeftIcon className="size-3.5" />
              Back
            </a>
          </Button>
        }
      />

      <div className="bg-card mx-auto flex max-w-2xl flex-col rounded border p-5">
        <div className="bg-muted/60 mb-5 flex items-start gap-2.5 rounded border p-3">
          <ShieldCheckIcon className="text-primary mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            This form deliberately collects no direct identifiers. The system
            issues an anonymised patient code, and clinical history is linked
            to that code alone.
          </p>
        </div>

        <Formik
          initialValues={entity}
          enableReinitialize
          validationSchema={PatientSchema}
          onSubmit={async (values, helpers) => {
            try {
              helpers.setSubmitting(true);

              if (patientId) {
                await updatePatient(patientId, values);
                toast.success("Patient updated.");
              } else {
                const response = await createPatient(values);
                toast.success(
                  `Patient registered as ${_.get(response, "data.data.patient_code", "")}.`,
                );
              }

              router.push(ROUTES.PATIENTS.LIST);
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <GlobalInput
                  id="age"
                  name="age"
                  label="Age (years)"
                  isRequired
                  type="number"
                  min={0}
                  max={120}
                  value={values.age}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={touched.age && errors.age}
                />

                <GlobalSelect
                  id="gender"
                  label="Gender"
                  isRequired
                  value={values.gender}
                  options={GENDER_OPTIONS}
                  errorMessage={touched.gender && errors.gender}
                  onValueChange={(value) => {
                    void setFieldValue("gender", value);
                    if (value !== GENDER_TYPES.FEMALE) {
                      void setFieldValue("is_pregnant", false);
                    }
                  }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <GlobalInput
                  id="district"
                  name="district"
                  label="District"
                  isRequired
                  placeholder="e.g. Raigad"
                  value={values.district}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={touched.district && errors.district}
                />

                <GlobalInput
                  id="state"
                  name="state"
                  label="State"
                  isRequired
                  value={values.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={touched.state && errors.state}
                />
              </div>

              <GlobalSelect
                id="facility_id"
                label="Registering facility"
                isRequired
                value={values.facility_id}
                options={facilities.map((item) => ({
                  label: `${item.name} · ${item.district}`,
                  value: item.id,
                }))}
                errorMessage={touched.facility_id && errors.facility_id}
                onValueChange={(value) =>
                  void setFieldValue("facility_id", value)
                }
              />

              {/* CHRONIC CONDITIONS STARTS */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="chronic-conditions">Chronic conditions</Label>

                {values.chronic_conditions.length > 0 && (
                  <div className="mb-1 flex flex-wrap gap-1.5">
                    {values.chronic_conditions.map((condition) => (
                      <Badge
                        key={condition}
                        variant="secondary"
                        className="h-6 gap-1 pr-1 pl-2"
                      >
                        {condition}
                        <button
                          type="button"
                          aria-label={`Remove ${condition}`}
                          onClick={() =>
                            void setFieldValue(
                              "chronic_conditions",
                              values.chronic_conditions.filter(
                                (item) => item !== condition,
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

                <div id="chronic-conditions" className="flex flex-wrap gap-1">
                  {COMMON_CHRONIC_CONDITIONS.filter(
                    (item) => !_.includes(values.chronic_conditions, item),
                  ).map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() =>
                        void setFieldValue("chronic_conditions", [
                          ...values.chronic_conditions,
                          condition,
                        ])
                      }
                      className="text-muted-foreground hover:border-primary/40 hover:text-foreground rounded-sm border border-dashed px-2 py-0.5 text-[10px] transition-colors"
                    >
                      + {condition}
                    </button>
                  ))}
                </div>
              </div>
              {/* CHRONIC CONDITIONS ENDS */}

              {values.gender === GENDER_TYPES.FEMALE && (
                <div className="flex items-center gap-2 rounded border p-3">
                  <Checkbox
                    id="is_pregnant"
                    checked={values.is_pregnant}
                    onCheckedChange={(checked) =>
                      void setFieldValue("is_pregnant", checked === true)
                    }
                  />
                  <Label htmlFor="is_pregnant" className="text-xs">
                    Currently pregnant (flags the record for antenatal
                    follow-up)
                  </Label>
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.push(ROUTES.PATIENTS.LIST)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <>
                      {patientId ? "Save changes" : "Register patient"}
                      <MoveRightIcon className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </>
  );
}
