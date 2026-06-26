import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryoWipes Dashboard",
  description: "AI-powered e-commerce dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
