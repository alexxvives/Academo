import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academy Hive - Secure Learning Platform",
  description: "Manage classes, teachers, students, and protected video lessons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
