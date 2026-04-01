"use client"

import RouteScreen, { type KioskRoute } from "./RouteScreen"

export default function ClientRoutePage({ route }: { route: KioskRoute }) {
 return <RouteScreen route={route} />
}
