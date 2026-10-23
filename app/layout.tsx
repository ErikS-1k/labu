import type { Metadata, Viewport } from "next";
import { Inter, Literata } from "next/font/google";
import { Suspense } from "react";
import ProgressBar from "@/components/ui/ProgressBar";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import InstallBanner from "@/components/pwa/InstallBanner";
import { SCRIPT_TEMA } from "@/lib/tema";
import "./globals.css";

// Sistema tipográfico dual:
//   Inter (font-sans, default) → interfaz: botones, navegación, badges, datos, formularios
//   Literata (font-serif)      → contenido humano en tamaños ≥ 18px: títulos de página,
//                                 títulos de publicaciones, nombres en el perfil, hero de la landing
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Fuente variable con eje de tamaño óptico (opsz): en títulos grandes usa trazos más finos.
// Los títulos serif van en font-medium (500) — en 700 se ve demasiado pesada.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "Labu — Marketplace de trabajo",
  description: "Conectá con quienes ofrecen y quienes buscan trabajo en Argentina.",
  manifest: "/manifest.json",
  icons: {
    icon: "/_1A1A1A.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Labu",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${inter.variable} ${literata.variable} h-full antialiased`}
      // El script de tema agrega la clase "light" antes de hidratar: React no debe quejarse
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        {children}
        <ServiceWorkerRegistration />
        <InstallBanner />
      </body>
    </html>
  );
}
