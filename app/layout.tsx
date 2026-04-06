import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ibe World Cup",
  description: "Porra del Mundial",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-192.png",
    apple: "/logo-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Ibe World Cup",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/logo-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>{children}</body>
    </html>
  );
}