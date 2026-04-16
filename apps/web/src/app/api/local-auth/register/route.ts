import { NextResponse } from "next/server";
import { registerLocalUser } from "../../../../server/local-auth-store";

type RegisterBody = {
  email?: string;
  name?: string;
  password?: string;
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as RegisterBody;

    const email = body.email?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const password = body.password?.trim() ?? "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Skriv inn en gyldig e-post" }, { status: 400 });
    }

    if (name.length < 2) {
      return NextResponse.json({ error: "Navn må være minst 2 tegn" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Passord må være minst 6 tegn" }, { status: 400 });
    }

    const user = registerLocalUser({ email, name, password });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke registrere bruker" },
      { status: 400 }
    );
  }
}
