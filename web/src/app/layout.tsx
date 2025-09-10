import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth"
import Header from '@/components/layout/Header'
import TopBar from '@/components/layout/TopBar'
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from 'react'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SmartSavor",
  description: "Find and share the best restaurants",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AuthProvider>
          <div className="w-full max-w-6xl mx-auto bg-white shadow-sm">
            <TopBar />
            <Header />
            <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <Suspense fallback={<div>Loading...</div>}>
                {children}
              </Suspense>
            </main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
