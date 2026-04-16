import type { Metadata } from "next";
import Link from "next/link";
import { TopNavAuth } from "../features/auth/top-nav-auth";
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
          </div>
          <TopNavAuth />
        </nav>
        {children}
      </body>
    </html>
  );
}
