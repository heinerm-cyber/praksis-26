import { NextResponse } from "next/server";
import { loginLocalUser } from "../../../../server/local-auth-store";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as LoginBody;

    const email = body.email?.trim() ?? "";
    const password = body.password?.trim() ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Fyll inn både e-post og passord" }, { status: 400 });
    }

    const user = loginLocalUser({ email, password });
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke logge inn" },
      { status: 401 }
    );
  }
}
