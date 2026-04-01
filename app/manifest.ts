import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
 return {
  name: "Evolve Performance Kiosk",
  short_name: "Evolve Kiosk",
  description: "Standalone kiosk flow for trials, memberships, and enquiries.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#071117",
  theme_color: "#071117",
  icons: [
   {
    src: "/icons/icon-192x192.png",
    sizes: "192x192",
    type: "image/png"
   },
   {
    src: "/icons/icon-512x512.png",
    sizes: "512x512",
    type: "image/png"
   },
   {
    src: "/icons/icon-512x512-maskable.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable"
   }
  ]
 }
}
