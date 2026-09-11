import type { Metadata } from "next";

import PatientsListing from "@/components/patients/patients-listing";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return <PatientsListing />;
}
