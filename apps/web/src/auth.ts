import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { authenticateLocalUser } from "./server/local-auth-store";

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim() && !value.startsWith("replace-with-"));
}

const hasGoogleOAuth =
  hasValue(process.env.GOOGLE_CLIENT_ID) && hasValue(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "E-post og passord",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Passord", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim() ?? "";
        const password = credentials?.password ?? "";

        if (!email || !password) {
          return null;
        }

        const user = authenticateLocalUser({ email, password });
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email
        };
      }
    }),
    ...(hasGoogleOAuth
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
          })
        ]
      : [])
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google") {
        const googleProfile = profile as { sub?: string } | undefined;
        token.sub = token.sub ?? googleProfile?.sub;
      }

      if (account?.provider === "credentials" && user) {
        token.sub = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.email ?? "";
      }

      return session;
    }
  }
};