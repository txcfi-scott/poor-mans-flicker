import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chris Harding Photography",
  description: "Aviation, landscapes, and urban photography",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
