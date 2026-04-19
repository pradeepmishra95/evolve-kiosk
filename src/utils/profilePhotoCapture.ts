export type CameraFacingMode = "user" | "environment"

const CAMERA_STREAM_IDEAL_DIMENSION = 1280
const PROFILE_PHOTO_MAX_DIMENSION = 720
const PROFILE_PHOTO_JPEG_QUALITY = 0.82

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
 new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(
   (blob) => {
    if (!blob) {
     reject(new Error("Could not capture the photo."))
     return
    }

    resolve(blob)
   },
   "image/jpeg",
   quality
  )
 })

const drawSourceToProfileCanvas = (
 source: CanvasImageSource,
 sourceWidth: number,
 sourceHeight: number
) => {
 const scale = Math.min(
  PROFILE_PHOTO_MAX_DIMENSION / sourceWidth,
  PROFILE_PHOTO_MAX_DIMENSION / sourceHeight,
  1
 )
 const width = Math.max(1, Math.round(sourceWidth * scale))
 const height = Math.max(1, Math.round(sourceHeight * scale))

 const canvas = document.createElement("canvas")
 canvas.width = width
 canvas.height = height

 const context = canvas.getContext("2d")

 if (!context) {
  throw new Error("Could not process the photo.")
 }

 context.drawImage(source, 0, 0, width, height)

 return canvas
}

const loadImageElementFromBlob = (blob: Blob) =>
 new Promise<HTMLImageElement>((resolve, reject) => {
  const objectUrl = URL.createObjectURL(blob)
  const image = new Image()

  image.onload = () => {
   URL.revokeObjectURL(objectUrl)
   resolve(image)
  }

  image.onerror = () => {
   URL.revokeObjectURL(objectUrl)
   reject(new Error("Could not process the selected photo."))
  }

  image.src = objectUrl
 })

export const buildProfilePhotoCameraConstraintAttempts = (
 facingMode: CameraFacingMode
): MediaStreamConstraints[] => [
 {
  video: {
   facingMode: {
    exact: facingMode
   },
   width: {
    ideal: CAMERA_STREAM_IDEAL_DIMENSION
   },
   height: {
    ideal: CAMERA_STREAM_IDEAL_DIMENSION
   }
  },
  audio: false
 },
 {
  video: {
   facingMode: {
    ideal: facingMode
   },
   width: {
    ideal: CAMERA_STREAM_IDEAL_DIMENSION
   },
   height: {
    ideal: CAMERA_STREAM_IDEAL_DIMENSION
   }
  },
  audio: false
 },
 {
  video: {
   width: {
    ideal: CAMERA_STREAM_IDEAL_DIMENSION
   },
   height: {
    ideal: CAMERA_STREAM_IDEAL_DIMENSION
   }
  },
  audio: false
 },
 {
  video: true,
  audio: false
 }
]

export const getNextCameraFacingMode = (facingMode: CameraFacingMode): CameraFacingMode =>
 facingMode === "user" ? "environment" : "user"

export const getCameraFacingModeLabel = (facingMode: CameraFacingMode) =>
 facingMode === "user" ? "Front" : "Back"

export const captureProfilePhotoFromVideo = async (videoElement: HTMLVideoElement) => {
 const sourceWidth = videoElement.videoWidth
 const sourceHeight = videoElement.videoHeight

 if (!sourceWidth || !sourceHeight) {
  throw new Error("Camera preview is not ready yet.")
 }

 const canvas = drawSourceToProfileCanvas(videoElement, sourceWidth, sourceHeight)

 return canvasToBlob(canvas, PROFILE_PHOTO_JPEG_QUALITY)
}

export const optimizeProfilePhotoBlob = async (blob: Blob) => {
 if (!blob.type.startsWith("image/")) {
  throw new Error("Please choose an image file.")
 }

 const image = await loadImageElementFromBlob(blob)
 const canvas = drawSourceToProfileCanvas(image, image.naturalWidth, image.naturalHeight)

 return canvasToBlob(canvas, PROFILE_PHOTO_JPEG_QUALITY)
}
