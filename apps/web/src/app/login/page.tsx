import { AuthForm } from "../../features/auth/auth-form";

export default function LoginPage(): JSX.Element {
  return (
    <main>
      <section className="hero">
        <h1>Logg inn</h1>
        <p>Logg inn for å hente dine personlige planer.</p>
      </section>
      <AuthForm mode="login" />
    </main>
  );
}
