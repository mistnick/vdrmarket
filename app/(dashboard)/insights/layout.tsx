import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
