import { AuthForm } from "../../features/auth/auth-form";

export default function LoginPage(): JSX.Element {
  return (
    <main>
      <AuthForm mode="login" />
    </main>
  );
}
