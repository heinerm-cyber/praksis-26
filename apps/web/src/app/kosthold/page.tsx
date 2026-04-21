"use client";

import { AuthGate } from "../../features/auth/auth-gate";
import { PumpDashboard } from "../../features/dashboard/pump-dashboard";

export default function DietPage(): JSX.Element {
  return (
    <AuthGate>
      {(session) => <PumpDashboard accessToken={session.accessToken} displayName={session.name} view="nutrition" />}
    </AuthGate>
  );
}