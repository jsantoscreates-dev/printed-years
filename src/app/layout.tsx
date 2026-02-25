import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "jsantoscreates",
  description: "Poster Gallery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ background: 'hsla(0, 0%, 2%, 1)' }}>
        {children}
      </body>
    </html>
  );
}
