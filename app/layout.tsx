import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DesktopSidebar } from "@/components/SideNav";
import ToastProvider from "@/components/ToastProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Riad di Siena Ops",
  description: "Operations dashboard for Riad di Siena",
  robots: "noindex, nofollow",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-ink antialiased">
        <ToastProvider>
          <div className="flex min-h-screen">
            <DesktopSidebar />
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
