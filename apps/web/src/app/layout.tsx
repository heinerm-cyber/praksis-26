import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "pump.no",
  description: "Kalori, kosthold og treningsplaner bygget for web og fremtidig mobilbruk"
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="no">
      <body>
        <nav className="top-nav" aria-label="Hovedmeny">
          <div className="top-nav-main">
            <Link href="/">Startside</Link>
            <Link href="/kalorier">Kalori og kosthold</Link>
            <Link href="/trening">Trening</Link>
            <Link href="/profil">Profil</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
          <div className="top-nav-auth" aria-label="Innlogging">
            <Link href="/login">Logg inn</Link>
            <Link href="/register">Registrer</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
