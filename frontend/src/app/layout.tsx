import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings-context";
import { AppSettings } from "@/components/ui/AppSettings";
import { ToastProvider } from "@/lib/toast";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Design Manager | Premium Dashboard",
  description: "A breathtaking management dashboard for creative teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        <ToastProvider>
          <SettingsProvider>
            {children}
            <AppSettings />
            <div id="portal-root" />
          </SettingsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
