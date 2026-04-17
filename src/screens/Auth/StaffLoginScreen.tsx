import { useEffect, useRef, useState } from "react"
import Container from "../../layout/Container"
import TextInput from "../../components/inputs/TextInput"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { signInStaff, signUpStaff } from "../../services/staffAuth"
import { useToastStore } from "../../store/toastStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { validateName } from "../../utils/validation"

type AuthMode = "login" | "signup"

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim())

const fileToProfilePhoto = (file: File) =>
 new Promise<string>((resolve, reject) => {
  const reader = new FileReader()

  reader.onload = () => {
   const image = new Image()

   image.onload = () => {
    const maxSize = 320
    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1)
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")

    if (!context) {
      reject(new Error("Could not process the selected image."))
      return
    }

    context.drawImage(image, 0, 0, width, height)
    resolve(canvas.toDataURL("image/jpeg", 0.82))
   }

   image.onerror = () => {
    reject(new Error("Could not read the selected image."))
   }

   image.src = typeof reader.result === "string" ? reader.result : ""
  }

  reader.onerror = () => {
   reject(new Error("Could not read the selected image."))
  }

  reader.readAsDataURL(file)
 })

const cameraConstraintAttempts: MediaStreamConstraints[] = [
 {
  video: {
   facingMode: {
    exact: "user"
   }
  },
  audio: false
 },
 {
  video: {
   facingMode: {
    exact: "environment"
   }
  },
  audio: false
 },
 {
  video: true,
  audio: false
 }
]

export default function StaffLoginScreen() {
 const [mode, setMode] = useState<AuthMode>("login")
 const [name, setName] = useState("")
 const [email, setEmail] = useState("")
 const [password, setPassword] = useState("")
 const [confirmPassword, setConfirmPassword] = useState("")
 const [profilePhoto, setProfilePhoto] = useState("")
 const [cameraOpen, setCameraOpen] = useState(false)
 const [cameraReady, setCameraReady] = useState(false)
 const [error, setError] = useState("")
 const [loading, setLoading] = useState(false)
 const [photoLoading, setPhotoLoading] = useState(false)
 const galleryInputRef = useRef<HTMLInputElement | null>(null)
 const videoRef = useRef<HTMLVideoElement | null>(null)
 const streamRef = useRef<MediaStream | null>(null)
 const showToast = useToastStore((state) => state.showToast)

 const isSignup = mode === "signup"

 useEffect(() => {
  if (!cameraOpen || !videoRef.current || !streamRef.current) {
   return
  }

  const videoElement = videoRef.current
  videoElement.srcObject = streamRef.current
  void videoElement.play().catch(() => {
   setError("Could not start the live camera preview. Try gallery instead.")
  })
 }, [cameraOpen])

 useEffect(() => {
  return () => {
   streamRef.current?.getTracks().forEach((track) => track.stop())
   streamRef.current = null
  }
 }, [])

 const handleSubmit = async () => {
  const normalizedEmail = email.trim()
  const nameValidation = validateName(name)
  const normalizedName = nameValidation.trimmedName

  if (isSignup && !nameValidation.isValid) {
   setError(nameValidation.error)
   return
  }

  if (!isValidEmail(normalizedEmail)) {
   setError("Enter a valid email address.")
   return
  }

  if (password.trim().length < 6) {
   setError("Password must be at least 6 characters.")
   return
  }

  if (isSignup && password !== confirmPassword) {
   setError("Passwords do not match.")
   return
  }

  if (isSignup && !profilePhoto) {
   setError("Capture a profile photo before creating the account.")
   return
  }

  try {
   setLoading(true)
   setError("")

   if (isSignup) {
    await signUpStaff(normalizedEmail, password, {
     name: normalizedName,
     photoURL: profilePhoto
    })
    showToast("You have signed up successfully.", "success")
   } else {
    await signInStaff(normalizedEmail, password)
   }

   setName("")
   setPassword("")
   setConfirmPassword("")
   setProfilePhoto("")
  } catch (submitError) {
   setError(submitError instanceof Error ? submitError.message : "Please try again.")
  } finally {
   setLoading(false)
  }
 }

 const handlePhotoSelection = async (file?: File | null) => {
  if (!file) {
   return
  }

  try {
   setPhotoLoading(true)
   setError("")
   const nextPhoto = await fileToProfilePhoto(file)
   setProfilePhoto(nextPhoto)
  } catch (photoError) {
   setError(photoError instanceof Error ? photoError.message : "Could not read the selected image.")
  } finally {
   setPhotoLoading(false)
  }
 }

 const stopCamera = () => {
  streamRef.current?.getTracks().forEach((track) => track.stop())
  streamRef.current = null

  if (videoRef.current) {
   videoRef.current.srcObject = null
  }

  setCameraOpen(false)
  setCameraReady(false)
 }

 const handleOpenCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
   setError("This browser does not support direct camera access. Use gallery instead.")
   return
  }

  try {
   setPhotoLoading(true)
   setError("")
   stopCamera()
   setCameraReady(false)

   let stream: MediaStream | null = null
   let lastError: unknown = null

   for (const constraints of cameraConstraintAttempts) {
    try {
     stream = await navigator.mediaDevices.getUserMedia(constraints)
     break
    } catch (attemptError) {
     lastError = attemptError
    }
   }

   if (!stream) {
    throw lastError
   }

   streamRef.current = stream
   setCameraOpen(true)
  } catch (cameraError) {
   const name =
    typeof cameraError === "object" && cameraError && "name" in cameraError
     ? String(cameraError.name)
     : ""

   if (name === "NotAllowedError") {
    setError("Camera permission was denied. Allow camera access and try again.")
   } else if (name === "NotFoundError") {
    setError("No camera was found on this device.")
   } else if (name === "NotReadableError") {
    setError("The camera is already being used by another app.")
   } else {
    setError("Could not open the camera on this browser. Try gallery instead.")
   }
  } finally {
   setPhotoLoading(false)
  }
 }

 const handleCapturePhoto = () => {
  if (!videoRef.current) {
   setError("Camera preview is not ready yet.")
   return
  }

  const videoElement = videoRef.current
  const sourceWidth = videoElement.videoWidth
  const sourceHeight = videoElement.videoHeight

  if (!sourceWidth || !sourceHeight) {
   setError("Camera preview is not ready yet.")
   return
  }

  const maxSize = 320
  const scale = Math.min(maxSize / sourceWidth, maxSize / sourceHeight, 1)
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")

  if (!context) {
   setError("Could not capture the photo.")
   return
  }

  context.drawImage(videoElement, 0, 0, width, height)
  setProfilePhoto(canvas.toDataURL("image/jpeg", 0.82))
  stopCamera()
 }

 return (
  <Container scrollable>
   <div style={styles.wrapper}>
    <p style={styles.eyebrow}>Staff Access</p>

    <h1 style={styles.title}>
     {isSignup ? "Create Staff Account" : "Login To Start"}
    </h1>

    <div style={styles.toggleRow}>
     <button
     type="button"
     onClick={() => {
       setMode("login")
       setName("")
       setProfilePhoto("")
       setConfirmPassword("")
       setError("")
      }}
      style={styles.toggleButton(mode === "login")}
     >
      Login
     </button>

     <button
      type="button"
      onClick={() => {
       setMode("signup")
       setPassword("")
       setConfirmPassword("")
       setError("")
      }}
      style={styles.toggleButton(mode === "signup")}
     >
      Sign Up
     </button>
    </div>

    <div style={styles.formCard}>
     {isSignup && (
      <>
       <TextInput
        label="Staff Name"
        value={name}
        placeholder="Enter full name"
        onChange={(value) => {
         setName(value)
         setError("")
        }}
       />

       <div style={styles.photoField}>
        <label style={styles.photoLabel}>Profile Photo</label>

        <div style={styles.photoRow}>
         <div style={styles.photoPreview}>
          {profilePhoto ? (
           <img
            src={profilePhoto}
            alt="Staff profile preview"
            style={styles.photoImage}
           />
          ) : (
           <span style={styles.photoPlaceholder}>No Photo</span>
          )}
         </div>

         <div style={styles.photoActions}>
          <div style={styles.photoButtonRow}>
           <button
            type="button"
            onClick={() => {
             void handleOpenCamera()
            }}
            style={styles.photoButton}
            disabled={photoLoading || cameraOpen}
           >
            {photoLoading ? "Processing..." : "Open Camera"}
           </button>

           <button
            type="button"
            onClick={() => {
             galleryInputRef.current?.click()
            }}
            style={styles.photoSecondaryButton}
            disabled={photoLoading}
           >
            Choose From Gallery
           </button>
          </div>

          <p style={styles.photoHint}>
           Use camera or gallery for the staff profile photo.
          </p>
         </div>
        </div>

        <input
         ref={galleryInputRef}
         type="file"
         accept="image/*"
         onChange={(event) => {
          void handlePhotoSelection(event.target.files?.[0] || null)
          event.currentTarget.value = ""
         }}
         style={{ display: "none" }}
        />
       </div>
      </>
     )}

     <TextInput
      label="Staff Email"
      type="email"
      inputMode="email"
      value={email}
      placeholder="Enter staff email"
      onChange={(value) => {
       setEmail(value)
       setError("")
      }}
     />

     <TextInput
      label="Password"
      type="password"
      value={password}
      placeholder="Enter password"
      onChange={(value) => {
       setPassword(value)
       setError("")
      }}
     />

     {isSignup && (
      <TextInput
       label="Confirm Password"
       type="password"
       value={confirmPassword}
       placeholder="Re-enter password"
       onChange={(value) => {
        setConfirmPassword(value)
        setError("")
       }}
      />
     )}

     {error && <p style={styles.error}>{error}</p>}

     <PrimaryButton
      title={loading ? (isSignup ? "Creating..." : "Logging In...") : isSignup ? "Create Account" : "Login"}
      onClick={() => {
       void handleSubmit()
      }}
      disabled={loading}
     />
    </div>

    {cameraOpen && (
     <div style={styles.cameraOverlay}>
      <div style={styles.cameraCard}>
       <p style={styles.cameraTitle}>Capture Profile Photo</p>

       <div style={styles.cameraViewport}>
        <video
         ref={videoRef}
         autoPlay
         playsInline
         muted
         onLoadedMetadata={() => {
          setCameraReady(true)
         }}
         style={styles.cameraVideo}
        />
       </div>

       <p style={styles.cameraHint}>
        {cameraReady ? "Align the face and capture the photo." : "Starting camera..."}
       </p>

       <div style={styles.cameraActionRow}>
        <button
         type="button"
         onClick={() => {
          stopCamera()
         }}
         style={styles.cameraSecondaryButton}
        >
         Cancel
        </button>

        <button
         type="button"
         onClick={handleCapturePhoto}
         style={styles.cameraPrimaryButton}
         disabled={!cameraReady}
        >
         Capture
        </button>
       </div>
      </div>
     </div>
    )}
   </div>
  </Container>
 )
}

const styles = {
 wrapper: {
  width: "min(100%, 560px)",
  margin: "0 auto",
  textAlign: "center" as const
 },

 eyebrow: {
  color: colors.secondary,
  fontSize: "13px",
  letterSpacing: "0.28em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  marginBottom: spacing.md
 },

 title: {
  ...typography.title,
  fontSize: "clamp(34px, 5vw, 54px)",
  lineHeight: 0.96,
  marginBottom: spacing.md
 },

 description: {
  color: colors.textSecondary,
  lineHeight: 1.7,
  maxWidth: "480px",
  margin: `0 auto ${spacing.lg}`
 },

 toggleRow: {
  display: "flex",
  justifyContent: "center",
  gap: spacing.sm,
  marginBottom: spacing.lg,
  flexWrap: "wrap" as const
 },

 toggleButton: (active: boolean) => ({
  minWidth: "120px",
  padding: "12px 18px",
  borderRadius: "999px",
  border: `1px solid ${active ? colors.primary : colors.borderStrong}`,
  background: active ? colors.primary : "transparent",
  color: active ? "#fff" : colors.textPrimary,
  fontWeight: 700,
  cursor: "pointer"
 }),

 formCard: {
  padding: spacing.xl,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
  textAlign: "left" as const
 },

 photoField: {
  marginBottom: spacing.md
 },

 photoLabel: {
  display: "block",
  marginBottom: spacing.sm,
  fontSize: "14px",
  color: colors.textSecondary,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  fontWeight: 700
 },

 photoRow: {
  display: "flex",
  alignItems: "center",
  gap: spacing.md,
  flexWrap: "wrap" as const,
  padding: "14px 16px",
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)"
 },

 photoPreview: {
  width: "84px",
  height: "84px",
  borderRadius: "50%",
  overflow: "hidden",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
 },

 photoImage: {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const
 },

 photoPlaceholder: {
  color: colors.textMuted,
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  textAlign: "center" as const
 },

 photoActions: {
  flex: 1,
  minWidth: "180px"
 },

 photoButtonRow: {
  display: "flex",
  gap: spacing.sm,
  flexWrap: "wrap" as const
 },

 photoButton: {
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "transparent",
  color: colors.primaryLight,
  padding: "10px 16px",
  cursor: "pointer",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700
 },

 photoSecondaryButton: {
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  padding: "10px 16px",
  cursor: "pointer",
  letterSpacing: "0.04em",
  fontSize: "12px",
  fontWeight: 700
 },

 photoHint: {
  color: colors.textMuted,
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: spacing.sm
 },

 cameraOverlay: {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(4,11,16,0.88)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.lg,
  zIndex: 1000
 },

 cameraCard: {
  width: "min(100%, 420px)",
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(160deg, rgba(17,28,35,0.96), rgba(8,15,20,0.96))",
  boxShadow: "0 32px 120px rgba(0, 0, 0, 0.45)"
 },

 cameraTitle: {
  color: colors.textPrimary,
  fontSize: "18px",
  fontWeight: 700,
  textAlign: "center" as const,
  marginBottom: spacing.md
 },

 cameraViewport: {
  width: "100%",
  aspectRatio: "3 / 4",
  borderRadius: radius.md,
  overflow: "hidden",
  border: `1px solid ${colors.border}`,
  background: "#000"
 },

 cameraVideo: {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const
 },

 cameraHint: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.5,
  textAlign: "center" as const,
  marginTop: spacing.md
 },

 cameraActionRow: {
  display: "flex",
  justifyContent: "center",
  gap: spacing.sm,
  flexWrap: "wrap" as const,
  marginTop: spacing.md
 },

 cameraSecondaryButton: {
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700
 },

 cameraPrimaryButton: {
  borderRadius: "999px",
  border: "none",
  background: colors.primary,
  color: colors.textOnAccent,
  padding: "10px 18px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
 },

 error: {
  color: "#F1A596",
  lineHeight: 1.6,
  marginTop: spacing.sm
 }
}
