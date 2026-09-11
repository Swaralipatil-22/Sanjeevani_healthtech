import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/global/routes";

/**
 * Landing route. `proxy.ts` has already established there is a valid session
 * by the time this renders, so it only has to choose a destination.
 */
export default function RootPage() {
  redirect(ROUTES.ENCOUNTERS.LIST);
}
