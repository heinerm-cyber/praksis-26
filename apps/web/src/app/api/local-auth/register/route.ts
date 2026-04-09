import { NextResponse } from "next/server";
import { registerLocalUser } from "../../../../server/local-auth-store";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as RegisterPayload;
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const password = body.password ?? "";

    if (name.length < 2) {
      return NextResponse.json({ error: "Navn må ha minst 2 tegn" }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Ugyldig e-post" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Passord må ha minst 8 tegn" }, { status: 400 });
    }

    const user = registerLocalUser({ name, email, password });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke registrere bruker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}