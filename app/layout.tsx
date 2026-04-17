import { Cormorant_Garamond, Manrope } from "next/font/google"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import ToastHost from "@/components/feedback/ToastHost"
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration"
import "./globals.css"

const manrope = Manrope({
 subsets: ["latin"],
 weight: ["400", "500", "600", "700", "800"],
 variable: "--font-manrope"
})

const cormorantGaramond = Cormorant_Garamond({
 subsets: ["latin"],
 weight: ["500", "600", "700"],
 variable: "--font-cormorant"
})

export const metadata: Metadata = {
 title: "Evolve Performance Kiosk",
 applicationName: "Evolve Kiosk",
 description: "Standalone kiosk flow for paid trial bookings, memberships, and enquiries.",
 manifest: "/manifest.webmanifest",
 icons: {
  icon: [
   {
    url: "/icons/icon-192x192.png",
    sizes: "192x192",
    type: "image/png"
   },
   {
    url: "/icons/icon-512x512.png",
    sizes: "512x512",
    type: "image/png"
   }
  ],
  shortcut: "/icons/icon-192x192.png",
  apple: [
   {
    url: "/icons/apple-touch-icon.png",
    sizes: "180x180",
    type: "image/png"
   }
  ]
 },
 appleWebApp: {
  capable: true,
  statusBarStyle: "black-translucent",
  title: "Evolve Kiosk"
 }
}

export const viewport: Viewport = {
 width: "device-width",
 initialScale: 1,
 themeColor: "#071117"
}

export default function RootLayout({
 children
}: Readonly<{
 children: ReactNode
}>) {
 return (
  <html
   lang="en"
   className={`${manrope.variable} ${cormorantGaramond.variable}`}
  >
   <body>
    {children}
    <ToastHost />
    <ServiceWorkerRegistration />
   </body>
  </html>
 )
}
