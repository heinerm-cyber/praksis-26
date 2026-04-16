import { AuthForm } from "../../features/auth/auth-form";

export default function RegisterPage(): JSX.Element {
  return (
    <main>
      <AuthForm mode="register" />
    </main>
  );
}
