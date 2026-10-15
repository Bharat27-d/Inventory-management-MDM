import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory & Product Management System (MDM)",
  description:
    "Full-stack Product Management System using Next.js, shadcn monochrome UI, Python Flask REST API, and SQLite database.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa] text-[#09090b] antialiased">
        {children}
      </body>
    </html>
  );
}
