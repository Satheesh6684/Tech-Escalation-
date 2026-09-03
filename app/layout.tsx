import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Escalations Amazon | Shadowfax",
  description:
    "Shadowfax internal dashboard for recording and managing Amazon rider tech escalations.",
  icons: {
    icon: "/shadowfax-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-bg text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
