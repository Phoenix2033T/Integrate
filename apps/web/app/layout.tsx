import type { Metadata, Viewport } from "next";
import PwaRegister from "../components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Integrate",
  title: {
    default: "Integrate",
    template: "%s · Integrate"
  },
  description: "A local-first notebook for handwriting, study, STEM, and AI-assisted learning.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Integrate",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: "/integrate-mark.svg",
    apple: "/integrate-mark.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf7ff" },
    { media: "(prefers-color-scheme: dark)", color: "#071827" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
