import { redirect } from "next/navigation";
import { findUserById } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Calendar } from "./components/Calendar";

export default async function PanelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login");

  return <Calendar />;
}


