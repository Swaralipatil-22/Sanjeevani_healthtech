import type { Metadata } from "next";

import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  {
    value: "5",
    label: "Outreach facilities",
    detail: "PHCs, sub-centres and mobile units across Maharashtra",
  },
  {
    value: "11",
    label: "Diagnosis categories",
    detail: "Including notifiable disease surveillance",
  },
  {
    value: "100%",
    label: "Actions audited",
    detail: "Every read, write and denial is recorded",
  },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* BRAND PANEL STARTS */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,var(--primary-strong),var(--primary-deep))] p-10 lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded bg-white/15 backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden="true"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg leading-tight font-semibold tracking-tight text-white">
              Sanjeevani
            </span>
            <span className="text-[11px] tracking-wide text-white/70">
              Rural Health Outreach Console
            </span>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-white">
            Clinical records that travel as far as your team does.
          </h1>
          <p className="mt-4 text-sm/relaxed text-white/75">
            Record encounters at the point of care, keep patient data
            pseudonymised by default, and give district administrators the
            trends they need — without ever exposing an identity.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label} className="flex flex-col border-l border-white/20 pl-3">
              <span className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white">
                {item.value}
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-white/85">
                {item.label}
              </span>
              <span className="mt-1 text-[10px] leading-snug text-white/55">
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* BRAND PANEL ENDS */}

      {/* FORM PANEL STARTS */}
      <div className="bg-background flex items-center justify-center p-6 sm:p-10">
        <LoginForm />
      </div>
      {/* FORM PANEL ENDS */}
    </div>
  );
}
