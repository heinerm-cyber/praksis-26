import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth";
import { PumpDashboard } from "../../features/dashboard/pump-dashboard";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <>
      <nav className="top-nav">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profil</Link>
        <a href="/api/auth/signout?callbackUrl=/login">Logg ut</a>
      </nav>
      <PumpDashboard userId={session.user.id} displayName={session.user.name ?? "Pump-bruker"} />
    </>
  );
}