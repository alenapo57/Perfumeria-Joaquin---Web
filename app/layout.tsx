import type { Metadata } from "next";
import { Fraunces, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Perfumería Joaquín — Perfumes árabes, réplicas y nacionales",
  description:
    "Perfumes árabes originales, réplicas, línea Yves D'Orgeval y nacionales. Envío gratis en San Carlos de Bolívar y a todo el país en compras superiores a $100.000.",
  openGraph: {
    title: "Perfumería Joaquín",
    description:
      "Perfumes árabes originales, réplicas, línea Yves D'Orgeval y nacionales. Envío gratis en San Carlos de Bolívar y a todo el país en compras superiores a $100.000.",
    url: SITE_URL,
    siteName: "Perfumería Joaquín",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
