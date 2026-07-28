import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import ProgressBar from "@/components/ui/ProgressBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Labu — Marketplace de trabajo",
  description: "Conectá con oferentes y demandantes de trabajo en Argentina.",
  icons: {
    icon: "/_1A1A1A.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
