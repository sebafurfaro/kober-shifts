import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

import { SettingsClient } from "./settingsClient";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/panel");

  return <SettingsClient />;
}


