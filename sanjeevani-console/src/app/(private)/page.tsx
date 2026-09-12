"use client";

import _ from "lodash";
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
  const profile = useAppSelector((state) => state.profile);

  useEffect(() => {
    // SessionProvider only renders children once hydration has settled, so
    // this runs with whatever the session produced. It never waits on the
    // role itself - an unknown role still has to resolve somewhere rather
    // than stranding the user on a splash screen.
    const role =
      profile.data?.role ?? _.get(profile.data, "role_details.name");

    router.replace(
      role === ROLES.ADMIN ? ROUTES.DASHBOARD : ROUTES.ENCOUNTERS.LIST,
    );
  }, [profile, router]);

  return <SplashScreen />;
}
