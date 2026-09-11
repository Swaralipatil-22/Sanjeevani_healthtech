import type { Metadata } from "next";

import EncountersListing from "@/components/encounters/encounters-listing";

export const metadata: Metadata = { title: "Encounters" };

export default function EncountersPage() {
  return <EncountersListing />;
}
