import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Origin — Database Explorer",
  description: "Exploration et administration des bases Personnages et Donjons."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
