import type { Metadata } from "next";

import EncounterDetail from "@/components/encounters/encounter-detail";

export const metadata: Metadata = { title: "Encounter" };

export default function EncounterDetailPage() {
  return <EncounterDetail />;
}
