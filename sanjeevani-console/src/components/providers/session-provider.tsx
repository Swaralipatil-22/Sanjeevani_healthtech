"use client";

import _ from "lodash";
import { useEffect, useState, type ReactNode } from "react";

import { SplashScreen } from "@/components/loaders/splash-screen";
import {
  listClinicians,
  listDiagnosisCategories,
  listFacilities,
} from "@/lib/apis/client";
import { getProfile } from "@/lib/apis/client/auth";
import { useAppDispatch } from "@/store/hooks";
import { setMasters } from "@/store/slices/masters.slice";
import { setProfile } from "@/store/slices/profile.slice";

/**
 * Hydrates the signed-in user's profile and permissions before the shell
 * renders. Everything downstream can then assume both are present, which
 * keeps permission checks synchronous.
 */
export default function SessionProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hydrate = async (): Promise<void> => {
      try {
        const [profile, facilities, categories, clinicians] = await Promise.all(
          [
            getProfile(),
            listFacilities(),
            listDiagnosisCategories(),
            listClinicians(),
          ],
        );

        dispatch(setProfile(_.get(profile, "data.data")));
        dispatch(
          setMasters({
            facilities: _.get(facilities, "data.data.data", []),
            diagnosis_categories: _.get(categories, "data.data.data", []),
            clinicians: _.get(clinicians, "data.data.data", []),
          }),
        );
      } finally {
        setIsReady(true);
      }
    };

    void hydrate();
  }, [dispatch]);

  if (!isReady) return <SplashScreen />;
  return <>{children}</>;
}
