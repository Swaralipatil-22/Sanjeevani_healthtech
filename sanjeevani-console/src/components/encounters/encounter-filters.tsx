"use client";

import _ from "lodash";

import type { EncounterFilter } from "@/lib/apis/client/encounters";

import MultiSelectFilter from "@/components/common/multi-select-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ENCOUNTER_STATUS_OPTIONS,
  SEVERITY_OPTIONS,
  VISIT_TYPE_OPTIONS,
} from "@/constants/global/labelvalues";
import { useAppSelector } from "@/store/hooks";

interface EncounterFiltersProps {
  value: EncounterFilter;
  onChange: (value: EncounterFilter) => void;
  onReset: () => void;
}

export default function EncounterFilters(props: EncounterFiltersProps) {
  const categories = useAppSelector((state) => state.masters.diagnosis_categories);
  const facilities = useAppSelector((state) => state.masters.facilities);

  const patch = (partial: Partial<EncounterFilter>): void =>
    props.onChange({ ...props.value, ...partial });

  const activeCount = Object.values(props.value).filter(
    (item) => !_.isNil(item) && (!Array.isArray(item) || item.length > 0),
  ).length;

  return (
    <div className="bg-card mb-4 rounded border p-4 lg:mb-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-primary text-[12px] font-semibold">
          Refine results
        </span>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={props.onReset}>
            Reset all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MultiSelectFilter
          label="Severity"
          options={SEVERITY_OPTIONS}
          selected={props.value.severity ?? []}
          onChange={(severity) => patch({ severity })}
        />

        <MultiSelectFilter
          label="Status"
          options={ENCOUNTER_STATUS_OPTIONS}
          selected={props.value.status ?? []}
          onChange={(status) => patch({ status })}
        />

        <MultiSelectFilter
          label="Visit type"
          options={VISIT_TYPE_OPTIONS}
          selected={props.value.visit_type ?? []}
          onChange={(visit_type) => patch({ visit_type })}
        />

        <MultiSelectFilter
          label="Diagnosis category"
          options={categories.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          selected={props.value.diagnosis_category_id ?? []}
          onChange={(diagnosis_category_id) => patch({ diagnosis_category_id })}
        />

        <MultiSelectFilter
          label="Facility"
          options={facilities.map((item) => ({
            label: item.name,
            value: item.id,
          }))}
          selected={props.value.facility_id ?? []}
          onChange={(facility_id) => patch({ facility_id })}
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="filter-from" className="text-[10px]">
              From
            </Label>
            <Input
              id="filter-from"
              type="date"
              className="h-8 min-h-8"
              value={props.value.from ?? ""}
              onChange={(event) =>
                patch({ from: event.target.value || undefined })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="filter-to" className="text-[10px]">
              To
            </Label>
            <Input
              id="filter-to"
              type="date"
              className="h-8 min-h-8"
              value={props.value.to ?? ""}
              onChange={(event) =>
                patch({ to: event.target.value || undefined })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
