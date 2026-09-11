import type {
  ENCOUNTER_SEVERITY,
  ENCOUNTER_STATUS,
  ENCOUNTER_VISIT_TYPES,
} from "@/constants/global/enums";

import {
  ENCOUNTER_STATUS_CHIPS,
  SEVERITY_CHIPS,
  SEVERITY_DOTS,
  VISIT_TYPE_CHIPS,
} from "@/constants/global/colors";
import {
  ENCOUNTER_STATUS_LABELS,
  SEVERITY_LABELS,
  VISIT_TYPE_LABELS,
} from "@/constants/global/labelvalues";
import { cn } from "@/lib/utils";

/**
 * Severity is always encoded twice - a dot and a word - so the table stays
 * readable without colour.
 */
export function SeverityChip({ value }: { value: ENCOUNTER_SEVERITY }) {
  return (
    <span className={cn(SEVERITY_CHIPS[value])}>
      <span className={SEVERITY_DOTS[value]} aria-hidden="true" />
      {SEVERITY_LABELS[value]}
    </span>
  );
}

export function EncounterStatusChip({ value }: { value: ENCOUNTER_STATUS }) {
  return (
    <span className={cn(ENCOUNTER_STATUS_CHIPS[value])}>
      {ENCOUNTER_STATUS_LABELS[value]}
    </span>
  );
}

export function VisitTypeChip({ value }: { value: ENCOUNTER_VISIT_TYPES }) {
  return (
    <span className={cn(VISIT_TYPE_CHIPS[value])}>
      {VISIT_TYPE_LABELS[value]}
    </span>
  );
}

export function Chip({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return <span className={className}>{children}</span>;
}
