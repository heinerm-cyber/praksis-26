"use client";

import { AuthGate } from "../../features/auth/auth-gate";
import { PumpDashboard } from "../../features/dashboard/pump-dashboard";

export default function TrainingPage(): JSX.Element {
  return (
    <AuthGate>
      {(session) => <PumpDashboard userId={session.userId} displayName={session.name} view="training" />}
    </AuthGate>
  );
}