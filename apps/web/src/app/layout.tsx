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
            <Link href="/kalorier">Kosthold</Link>
            <Link href="/trening">Trening</Link>
            <Link href="/profil" className="profile-icon-link" aria-label="Profil" title="Profil">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" />
              </svg>
            </Link>
          </div>
          <TopNavAuth />
        </nav>
        {children}
      </body>
    </html>
  );
}
