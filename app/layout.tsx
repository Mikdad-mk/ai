import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/contexts/theme-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://usthad.ai'),
  title: {
    default: "AI Ustad - The Authentic Islamic Scholar | Ahlussunnah Wal Jama'a",
    template: "%s | AI Ustad"
  },
  description: "Your intelligent Islamic scholar rooted in Ahlussunnah wal Jama'a methodology. Developed by the Students of Islamic Da'wa Academy, Akode. Ask questions based on Fathul Mueen.",
  keywords: ["Islamic AI", "Ahlussunnah wal Jama'a", "Fathul Mueen", "Shafi'i Fiqh", "Samastha", "Kerala Islam", "Islamic Scholar AI", "Fatwa AI", "Malayalam Islamic AI", "Islamic Da'wa Academy Students", "Sunni AI"],
  authors: [{ name: "Students of Islamic Da'wa Academy", url: "https://usthad.ai" }],
  creator: "Students of Islamic Da'wa Academy",
  publisher: "AI Ustad",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "AI Ustad - The Authentic Islamic Scholar | Ahlussunnah Wal Jama'a",
    description: "Your intelligent Islamic scholar rooted in Ahlussunnah wal Jama'a methodology. Developed by the Students of Islamic Da'wa Academy, Akode.",
    url: 'https://usthad.ai',
    siteName: 'AI Ustad',
    images: [
      {
        url: 'https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png',
        width: 800,
        height: 800,
        alt: 'AI Ustad Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "AI Ustad - The Authentic Islamic Scholar | Ahlussunnah Wal Jama'a",
    description: "Your intelligent Islamic scholar rooted in Ahlussunnah wal Jama'a methodology. Developed by the Students of Islamic Da'wa Academy.",
    images: ['https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png'],
  },
  icons: {
    icon: "https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png",
    shortcut: "https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png",
    apple: "https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png",
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased ${_notoSans.variable} ${_notoSans.className}`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
