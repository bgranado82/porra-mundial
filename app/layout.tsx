
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ibewc2026.com"),
  title: "Ibe World Cup",
  description: "Porra del Mundial",
  manifest: "/manifest.json",

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },

  openGraph: {
    title: "Ibe World Cup",
    description: "Porra del Mundial",
    url: "https://ibewc2026.com",
    siteName: "Ibe World Cup",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ibe World Cup",
      },
    ],
    locale: "es_ES",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Ibe World Cup",
    description: "Porra del Mundial",
    images: ["/og-image.png"],
  },

  appleWebApp: {
    capable: true,
    title: "Ibe World Cup",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}