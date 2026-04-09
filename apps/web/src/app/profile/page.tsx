import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth";
import { PumpProfile } from "../../features/profile/pump-profile";

export default async function ProfilePage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  return (
    <>
      <nav className="top-nav">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profil</Link>
        <a href="/api/auth/signout?callbackUrl=/login">Logg ut</a>
      </nav>
      <PumpProfile
        userId={session.user.id}
        email={session.user.email}
        displayName={session.user.name ?? "Pump-bruker"}
      />
    </>
  );
}