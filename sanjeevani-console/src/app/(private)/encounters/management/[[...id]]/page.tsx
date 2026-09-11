import type { Metadata } from "next";

import EncounterForm from "@/components/encounters/encounter-form";

export const metadata: Metadata = { title: "Record Encounter" };

/**
 * Optional catch-all: `/encounters/management` creates, and
 * `/encounters/management/<id>` updates, from one component.
 */
export default function EncounterManagementPage() {
  return <EncounterForm />;
}
