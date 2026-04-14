import { AuthForm } from "../../features/auth/auth-form";

export default function RegisterPage(): JSX.Element {
  return (
    <main>
      <section className="hero">
        <h1>Registrer bruker</h1>
        <p>Lag en lokal bruker for å lagre og hente egne planer.</p>
      </section>
      <AuthForm mode="register" />
    </main>
  );
}
