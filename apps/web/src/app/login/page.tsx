import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth";
import { LoginForm } from "../../features/auth/login-form";

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim() && !value.startsWith("replace-with-"));
}

export default async function LoginPage(): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);
  const googleEnabled =
    hasValue(process.env.GOOGLE_CLIENT_ID) && hasValue(process.env.GOOGLE_CLIENT_SECRET);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main>
      <section className="hero">
        <h1>pump.no</h1>
        <p>Logg inn for å få personlig dashboard, profil, kaloriplan og treningsforslag.</p>
      </section>

      <section className="grid">
        <LoginForm googleEnabled={googleEnabled} />
      </section>
    </main>
  );
}