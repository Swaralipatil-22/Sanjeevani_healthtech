"use client";

import { Formik } from "formik";
import { ActivityIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const LoginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Enter a valid email address.")
    .required("Email is required."),
  password: Yup.string().required("Password is required."),
});

const DEMO_ACCOUNTS = [
  { role: "Doctor", email: "doctor@sanjeevani.health" },
  { role: "Nurse", email: "nurse@sanjeevani.health" },
  { role: "Administrator", email: "admin@sanjeevani.health" },
];

const DEMO_PASSWORD = "Sanjeevani@123";

export default function LoginForm() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <div className="text-primary-foreground flex size-9 items-center justify-center rounded bg-[linear-gradient(135deg,var(--primary-strong),var(--primary-deep))]">
          <ActivityIcon className="size-4.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm leading-tight font-semibold">Sanjeevani</span>
          <span className="text-muted-foreground text-[10px]">
            Rural Health Outreach
          </span>
        </div>
      </div>

      <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
      <p className="text-muted-foreground mt-1 mb-6 text-xs/relaxed">
        Use the credentials issued by your district health administrator.
      </p>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={async (values, helpers) => {
          helpers.setSubmitting(true);

          const result = await login(values.email, values.password);

          if (!result.success) {
            toast.error(result.detail ?? "Unable to sign in.");
            helpers.setSubmitting(false);
            return;
          }

          toast.success("Signed in successfully.");
          router.replace(result.redirect_to || "/");
          router.refresh();
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="doctor@sanjeevani.health"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.email && errors.email)}
              />
              {touched.email && errors.email && (
                <span className="text-destructive text-[11px]">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="pr-9"
                  aria-invalid={Boolean(touched.password && errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((previous) => !previous)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordVisible ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <span className="text-destructive text-[11px]">
                  {errors.password}
                </span>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-2 w-full"
            >
              {isSubmitting ? <Spinner className="size-3.5" /> : "Sign in"}
            </Button>
          </form>
        )}
      </Formik>

      {/* DEMO ACCOUNTS STARTS */}
      <div className="mt-8 rounded border p-3">
        <div className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
          Demo accounts
        </div>
        <div className="flex flex-col gap-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <div
              key={account.email}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="text-muted-foreground">{account.role}</span>
              <span className="font-medium">{account.email}</span>
            </div>
          ))}
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t pt-1.5 text-[11px]">
            <span className="text-muted-foreground">Password</span>
            <span className="font-medium">{DEMO_PASSWORD}</span>
          </div>
        </div>
      </div>
      {/* DEMO ACCOUNTS ENDS */}
    </div>
  );
}
