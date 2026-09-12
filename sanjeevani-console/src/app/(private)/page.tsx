"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SplashScreen } from "@/components/loaders/splash-screen";
import { ROLES } from "@/constants/global/enums";
import { ROUTES } from "@/constants/global/routes";
import { useAppSelector } from "@/store/hooks";

/**
 * Landing route. Sits inside the private group so the session is already
 * hydrated, which is what makes a role-aware destination possible: an
 * administrator has no clinical worklist, so sending them to Encounters
 * would land them on a page that is not theirs.
 */
export default function RootPage() {
  const router = useRouter();
  const role = useAppSelector((state) => state.profile.data?.role);

  useEffect(() => {
    if (!role) return;

    router.replace(
      role === ROLES.ADMIN ? ROUTES.DASHBOARD : ROUTES.ENCOUNTERS.LIST,
    );
  }, [role, router]);

  return <SplashScreen />;
}
