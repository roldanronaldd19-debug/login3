import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestión de Residuos Sólidos - Cantón Daule",
  description: "Plataforma integral para el monitoreo, reporte y gestión de residuos sólidos en el cantón Daule",
  generator: "v0.app",
  keywords: ["residuos sólidos", "gestión ambiental", "Daule", "ecología", "sostenibilidad"],
  authors: [{ name: "GAD Cantón Daule" }],
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "https://residuosdaule.vercel.app",
    title: "Gestión de Residuos Sólidos - Cantón Daule",
    description: "Plataforma integral para el monitoreo, reporte y gestión de residuos sólidos",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${geist.className} antialiased bg-background text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
