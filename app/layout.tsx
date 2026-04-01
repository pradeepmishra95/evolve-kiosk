import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
 title: "Evolve Kiosk",
 description: "Standalone kiosk flow for trials, memberships, and enquiries."
}

export default function RootLayout({
 children
}: Readonly<{
 children: ReactNode
}>) {
 return (
  <html lang="en">
   <body>{children}</body>
  </html>
 )
}
