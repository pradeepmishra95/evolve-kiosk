import { useLayoutEffect, useState } from "react"
import { breakpoints } from "../styles/GlobalStyles"

type DeviceState = {
 isMobile: boolean
 isTablet: boolean
 isDesktop: boolean
 isShortHeight: boolean
 isCompactHeight: boolean
 viewportHeight: number
}

const getDeviceState = (): DeviceState => {
 if (typeof window === "undefined") {
  return {
   isMobile: false,
   isTablet: false,
   isDesktop: true,
   isShortHeight: false,
   isCompactHeight: false,
   viewportHeight: 0
  }
 }

 const width = window.innerWidth
 const height = window.innerHeight

 return {
  isMobile: width <= breakpoints.mobile,
  isTablet: width > breakpoints.mobile && width <= breakpoints.tablet,
  isDesktop: width > breakpoints.tablet,
  isShortHeight: height <= 820,
  isCompactHeight: height <= 700,
  viewportHeight: height
 }
}

export const useDevice = () => {
 const [device, setDevice] = useState<DeviceState>(getDeviceState)

 useLayoutEffect(() => {
  const handleResize = () => {
   setDevice(getDeviceState())
  }

  handleResize()

  window.addEventListener("resize", handleResize)
  window.addEventListener("orientationchange", handleResize)
  window.visualViewport?.addEventListener("resize", handleResize)

  return () => {
   window.removeEventListener("resize", handleResize)
   window.removeEventListener("orientationchange", handleResize)
   window.visualViewport?.removeEventListener("resize", handleResize)
  }
 }, [])

 return device
}
