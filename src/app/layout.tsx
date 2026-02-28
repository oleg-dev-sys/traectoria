import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Траектория — Трекер целей",
  description: "Геймифицированный трекер целей с ежедневными квестами. Создай свой Билет Мечты и достигай целей!",
  keywords: ["трекер целей", "мотивация", "квесты", "прогресс", "геймификация", "streak"],
  authors: [{ name: "Trajectory Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Траектория",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Траектория — Трекер целей",
    description: "Создай свой Билет Мечты и достигай целей с ежедневными квестами",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Траектория — Трекер целей",
    description: "Геймифицированный трекер целей с ежедневными квестами",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#000000] text-white`}>
        {children}
      </body>
    </html>
  );
}
