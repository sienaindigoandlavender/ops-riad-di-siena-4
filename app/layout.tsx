import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Riad di Siena Ops",
  description: "Operations dashboard for Riad di Siena",
  robots: "noindex, nofollow",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa] text-black antialiased">
        {children}
      </body>
    </html>
  );
}
