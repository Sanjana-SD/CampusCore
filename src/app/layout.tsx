import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusCore | Integrated Campus Portal",
  description: "CampusCore educational management system with admin, faculty, and student dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
