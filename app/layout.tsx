import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstaAutopost",
  description: "A safe dashboard for Instagram Business automation."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
