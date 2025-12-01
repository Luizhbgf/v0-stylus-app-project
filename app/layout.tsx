import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { createClient } from "@/lib/supabase/server"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()

  let settings = null
  try {
    const { data } = await supabase
      .from("homepage_settings")
      .select("meta_title, meta_description, meta_keywords, favicon_url")
      .single()
    settings = data
  } catch (error) {
    console.log("[v0] Could not load homepage settings for metadata")
  }

  return {
    title: settings?.meta_title || "Styllus - Estética e Beleza",
    description:
      settings?.meta_description ||
      "Sistema de agendamento online para salão de beleza. Agende seus serviços de forma rápida e prática.",
    keywords:
      settings?.meta_keywords?.join(", ") ||
      "salão de beleza, estética, agendamento online, manicure, cabelo, maquiagem",
    icons: {
      icon: settings?.favicon_url || "/favicon.ico",
      apple: "/icon-styllus.png",
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
