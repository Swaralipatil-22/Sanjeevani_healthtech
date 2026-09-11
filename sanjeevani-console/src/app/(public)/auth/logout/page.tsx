import { redirect } from "next/navigation";

import { logout } from "@/app/actions/auth";
import { ROUTES } from "@/constants/global/routes";

export default async function LogoutPage() {
  await logout();
  redirect(ROUTES.AUTH.LOGIN);
}
