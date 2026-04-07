import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pump.no",
  description: "Kalori, kosthold og treningsplaner bygget for web og fremtidig mobilbruk"
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}
