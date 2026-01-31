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
  title: "AI Ustad - The Knowledge Scholar",
  description: "AI Ustad: Your intelligent knowledge guide powered by Gemini",
  icons: {
    icon: "https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png",
    shortcut: "https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png",
    apple: "https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png",
  },
    generator: 'v0.app'
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
