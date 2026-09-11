import type { Metadata } from "next";

import PatientForm from "@/components/patients/patient-form";

export const metadata: Metadata = { title: "Register Patient" };

export default function PatientManagementPage() {
  return <PatientForm />;
}
