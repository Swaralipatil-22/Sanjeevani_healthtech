import type { Metadata } from "next";

import UsersListing from "@/components/administration/users-listing";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  return <UsersListing />;
}
