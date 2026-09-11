import type { Metadata } from "next";

import PatientDetail from "@/components/patients/patient-detail";

export const metadata: Metadata = { title: "Patient" };

export default function PatientDetailPage() {
  return <PatientDetail />;
}
