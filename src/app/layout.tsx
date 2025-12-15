import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKADEMO - Plataforma de Aprendizaje Seguro",
  description: "Gestiona clases, profesores, estudiantes y lecciones de video protegidas",
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
