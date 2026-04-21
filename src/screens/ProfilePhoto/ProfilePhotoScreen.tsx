"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { useDevice } from "../../hooks/useDevice"
import { useToastStore } from "../../store/toastStore"
import { useUserStore } from "../../store/userStore"
import { getProfilePhotoUploadStatusMessage, uploadProfilePhoto } from "../../services/profilePhoto"
import type { ProfilePhotoSource } from "../../types/domain"
import { colors, radius, shadow, spacing, typography } from "../../styles/GlobalStyles"
import { optimizeProfilePhotoBlob } from "../../utils/profilePhotoCapture"
import { formatPhoneNumber } from "../../utils/validation"
import { getNextRoute } from "../../flow/getNextRoute"
import { ROUTES } from "../../flow/routes"

const PROFILE_PHOTO_FILE_NAME = "profile-photo.jpg"

export default function ProfilePhotoScreen() {
 const navigate = useNavigate()
 const showToast = useToastStore((state) => state.showToast)
 const { isMobile, isTablet, isPortrait } = useDevice()

 const state = useUserStore()
 const {
  name,
  phone,
  countryCode,
  age,
  purpose,
  status,
  profilePhotoUrl,
  profilePhotoStoragePath,
  profilePhotoHash,
  profilePhotoUploadedAt,
  profilePhotoSource,
  setData
 } = state

 const [photoUploading, setPhotoUploading] = useState(false)
 const [errorMessage, setErrorMessage] = useState("")
 const [statusMessage, setStatusMessage] = useState(
  profilePhotoUrl || profilePhotoStoragePath
   ? "Profile photo already saved."
   : "Take a client profile photo to continue."
 )
 const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
 const [pendingFileName, setPendingFileName] = useState(PROFILE_PHOTO_FILE_NAME)
 const [pendingSource, setPendingSource] = useState<ProfilePhotoSource>("camera")
 const [draftPreviewUrl, setDraftPreviewUrl] = useState("")
 const cameraInputRef = useRef<HTMLInputElement | null>(null)
 const galleryInputRef = useRef<HTMLInputElement | null>(null)
 const previewUrlRef = useRef<string | null>(null)

 const displayPhotoUrl = draftPreviewUrl || profilePhotoUrl
 const hasSavedPhoto = Boolean(profilePhotoUrl || profilePhotoStoragePath)
 const isRequiredFlow = status === "new" && purpose === "enroll"
 const canContinue = (!isRequiredFlow || hasSavedPhoto) && !photoUploading
 const phoneLabel = formatPhoneNumber(phone, countryCode) || phone || "-"
 const ageLabel = typeof age === "number" ? `${age} years` : "-"
 const useSingleColumnLayout = isMobile || (isTablet && isPortrait)

 const releaseDraftPreview = useCallback(() => {
  if (previewUrlRef.current) {
   URL.revokeObjectURL(previewUrlRef.current)
   previewUrlRef.current = null
  }
 }, [])

 useEffect(() => {
  return () => {
   releaseDraftPreview()
  }
 }, [releaseDraftPreview])

 useEffect(() => {
  if (profilePhotoUrl && !draftPreviewUrl) {
   setStatusMessage("Profile photo already saved.")
  }
 }, [draftPreviewUrl, profilePhotoUrl])

 const uploadPhoto = async (blob: Blob, source: ProfilePhotoSource, fileName: string) => {
  if (!name || !phone) {
   setErrorMessage("Member details are missing. Please go back and fill them again.")
   return
  }

  try {
   setPhotoUploading(true)
   setErrorMessage("")
   setStatusMessage("Preparing profile photo...")

   const result = await uploadProfilePhoto({
    name: name.trim(),
    phone,
    countryCode,
    source,
    blob,
    fileName,
    contentType: blob.type || "image/jpeg",
    onProgress: (progress) => {
     setStatusMessage(getProfilePhotoUploadStatusMessage(progress))
    }
   })

   setData({
    profilePhotoUrl: result.downloadUrl,
    profilePhotoStoragePath: result.storagePath,
    profilePhotoHash: result.hash,
    profilePhotoUploadedAt: result.uploadedAt,
    profilePhotoSource: result.source
   })

   releaseDraftPreview()
   setDraftPreviewUrl("")
   setPendingBlob(null)
   setPendingFileName(PROFILE_PHOTO_FILE_NAME)
   setPendingSource(source)
   setStatusMessage("Profile photo saved successfully. Continue to the next step.")
   showToast("Profile photo saved.", "success")
  } catch (error) {
   setErrorMessage(error instanceof Error ? error.message : "Could not save the profile photo.")
   setStatusMessage("Profile photo upload failed. Please retry.")
  } finally {
   setPhotoUploading(false)
  }
 }

 const handleSelectTakePhoto = () => {
  setErrorMessage("")
  cameraInputRef.current?.click()
 }

 const handleSelectGallery = () => {
  setErrorMessage("")
  galleryInputRef.current?.click()
 }

 const handlePhotoFile = async (file: File | null | undefined, source: ProfilePhotoSource) => {
  if (!file) {
   return
  }

  if (!file.type.startsWith("image/")) {
   setErrorMessage("Please choose an image file.")
   return
  }

  try {
   setErrorMessage("")
   setStatusMessage(source === "camera" ? "Optimizing captured photo..." : "Optimizing selected photo...")
   const optimizedBlob = await optimizeProfilePhotoBlob(file)

   releaseDraftPreview()
   const objectUrl = URL.createObjectURL(optimizedBlob)
   previewUrlRef.current = objectUrl
   setDraftPreviewUrl(objectUrl)
   setPendingBlob(optimizedBlob)
   setPendingFileName(PROFILE_PHOTO_FILE_NAME)
   setPendingSource(source)
   void uploadPhoto(optimizedBlob, source, PROFILE_PHOTO_FILE_NAME)
  } catch (error) {
   setErrorMessage(error instanceof Error ? error.message : "Could not process the selected photo.")
   setStatusMessage("Please choose another image or try again.")
  }
 }

 const handleRetryUpload = () => {
  if (!pendingBlob) {
   setErrorMessage("Capture or select a photo first.")
   return
  }

  void uploadPhoto(pendingBlob, pendingSource, pendingFileName)
 }

 const handleContinue = () => {
  if (!canContinue) {
   setErrorMessage("Please capture and save the profile photo before continuing.")
   return
  }

  navigate(getNextRoute(ROUTES.PROFILE_PHOTO, state) ?? "/program")
 }

 return (
  <Container scrollable>
   <div style={styles.wrapper}>
    <div style={styles.surface}>
     <div style={styles.header}>
      <div>
       <p style={styles.eyebrow}>Client Profile</p>
       <h1 style={styles.title}>Capture a premium profile photo</h1>
       <p style={styles.description}>
        Take a clear client picture for the member profile. This keeps the record easy to identify for staff and
        returns safely to the same profile after refresh.
       </p>
      </div>

      <div style={styles.metaPills}>
       <span style={styles.metaPill}>Name: {name || "-"}</span>
       <span style={styles.metaPill}>Phone: {phoneLabel}</span>
       <span style={styles.metaPill}>Age: {ageLabel}</span>
      </div>
     </div>

     <div style={styles.grid(useSingleColumnLayout)}>
      <div style={styles.guidanceCard}>
       <h2 style={styles.sectionTitle}>Why this step matters</h2>

       <ul style={styles.guidanceList}>
        <li style={styles.guidanceItem}>Profile photo becomes part of the member record.</li>
        <li style={styles.guidanceItem}>Camera capture is the primary path, gallery is a fallback.</li>
        <li style={styles.guidanceItem}>The photo is stored in Firebase Storage with Firestore metadata.</li>
        <li style={styles.guidanceItem}>You can retake the photo anytime before moving ahead.</li>
       </ul>

       <div style={styles.statusCard}>
        <span style={styles.statusLabel}>Status</span>
        <p style={styles.statusText}>{statusMessage}</p>
       </div>

       {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}

       {!isRequiredFlow && (
        <p style={styles.helperText}>
         This photo step is still available as a profile enhancement, even outside the main registration flow.
        </p>
       )}
      </div>

      <div style={styles.captureCard}>
       <div style={styles.previewFrame}>
        {displayPhotoUrl ? (
         <img src={displayPhotoUrl} alt="Client profile preview" style={styles.previewImage} />
        ) : (
         <div style={styles.placeholder}>
          <div style={styles.placeholderAvatar}>Photo</div>
          <p style={styles.placeholderTitle}>No photo captured yet</p>
          <p style={styles.placeholderText}>Use Take Photo or Choose Gallery to create the member profile picture.</p>
         </div>
        )}
       </div>

       <div style={styles.actionRow}>
        <button
         type="button"
         onClick={handleSelectTakePhoto}
         style={styles.secondaryAction}
         disabled={photoUploading}
        >
         {photoUploading ? "Uploading..." : "Take Photo"}
        </button>

        <button
         type="button"
         onClick={handleSelectGallery}
         style={styles.secondaryAction}
         disabled={photoUploading}
        >
         Choose Gallery
        </button>

        <button
         type="button"
         onClick={handleRetryUpload}
         style={styles.tertiaryAction}
         disabled={photoUploading || !pendingBlob}
        >
         Retry Upload
        </button>
       </div>

       <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={(event) => {
         void handlePhotoFile(event.target.files?.[0] || null, "camera")
         event.currentTarget.value = ""
        }}
        style={{ display: "none" }}
       />

       <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
         void handlePhotoFile(event.target.files?.[0] || null, "gallery")
         event.currentTarget.value = ""
        }}
        style={{ display: "none" }}
       />

       <div style={styles.infoRow}>
        <span style={styles.infoChip}>Camera preferred</span>
        <span style={styles.infoChip}>
         {profilePhotoSource ? `Saved via ${profilePhotoSource}` : "Gallery fallback"}
        </span>
        <span style={styles.infoChip}>
         {profilePhotoUploadedAt
          ? `Uploaded ${new Date(profilePhotoUploadedAt).toLocaleDateString()}`
          : profilePhotoHash
           ? "Hash recorded"
           : "Audit ready"}
        </span>
       </div>
      </div>
     </div>

     <div style={styles.footerCard(useSingleColumnLayout)}>
      <div>
       <p style={styles.footerTitle}>Ready to continue?</p>
       <p style={styles.footerText}>
        {hasSavedPhoto
         ? "The profile photo is saved and can be used immediately."
         : "Capture and save the photo before moving to program selection."}
       </p>
      </div>

      <PrimaryButton
       title={photoUploading ? "Uploading..." : "Continue to Program"}
       onClick={handleContinue}
       disabled={!canContinue}
       fullWidth={useSingleColumnLayout}
      />
     </div>
    </div>

   </div>
  </Container>
 )
}

const styles = {
 wrapper: {
  width: "100%",
  maxWidth: "960px",
  margin: "0 auto",
  boxSizing: "border-box" as const
 },
 surface: {
  borderRadius: radius.xl,
  border: `1px solid ${colors.border}`,
  background:
   "linear-gradient(160deg, rgba(12,22,28,0.94), rgba(7,15,20,0.92) 58%, rgba(16,29,35,0.95))",
  boxShadow: shadow.card,
  padding: "clamp(18px, 3vw, 32px)",
  backdropFilter: "blur(20px)"
 },
 header: {
  display: "flex",
  justifyContent: "space-between",
  gap: spacing.lg,
  flexWrap: "wrap" as const,
  alignItems: "flex-start"
 },
 eyebrow: {
  color: colors.secondary,
  fontSize: "12px",
  letterSpacing: "0.28em",
  textTransform: "uppercase" as const,
  fontWeight: 800,
  marginBottom: spacing.sm
 },
 title: {
  ...typography.title,
  fontSize: "clamp(30px, 4vw, 48px)",
  lineHeight: 0.98,
  marginBottom: spacing.sm
 },
 description: {
  color: colors.textSecondary,
  lineHeight: 1.7,
  maxWidth: "620px"
 },
 metaPills: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: spacing.sm,
  justifyContent: "flex-end"
 },
 metaPill: {
  padding: "10px 14px",
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textSecondary,
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  fontWeight: 700
 },
 grid: (useSingleColumnLayout: boolean) => ({
  display: "grid",
  gridTemplateColumns: useSingleColumnLayout ? "1fr" : "minmax(0, 1fr) minmax(0, 1.05fr)",
  gap: spacing.lg,
  marginTop: spacing.lg
 }),
 guidanceCard: {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
 },
 sectionTitle: {
  color: colors.textPrimary,
  fontSize: "18px",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: spacing.md
 },
 guidanceList: {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: spacing.sm
 },
 guidanceItem: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  paddingLeft: "18px",
  position: "relative" as const
 },
 statusCard: {
  marginTop: spacing.lg,
  padding: spacing.md,
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)"
 },
 statusLabel: {
  display: "block",
  color: colors.primaryLight,
  fontSize: "11px",
  letterSpacing: "0.24em",
  textTransform: "uppercase" as const,
  fontWeight: 800,
  marginBottom: spacing.xs
 },
 statusText: {
  color: colors.textPrimary,
  lineHeight: 1.6,
  fontSize: "14px"
 },
 helperText: {
  color: colors.textMuted,
  lineHeight: 1.6,
  fontSize: "13px",
  marginTop: spacing.md
 },
 errorText: {
  color: "#F1A596",
  lineHeight: 1.6,
  fontSize: "13px",
  marginTop: spacing.md
 },
 captureCard: {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
 },
 previewFrame: {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  overflow: "hidden",
  background: "linear-gradient(180deg, rgba(12,20,25,0.92), rgba(5,10,14,0.96))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
 },
 previewImage: {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const
 },
 placeholder: {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.lg,
  textAlign: "center" as const,
  gap: spacing.sm
 },
 placeholderAvatar: {
  width: "108px",
  height: "108px",
  borderRadius: "50%",
  border: `1px solid ${colors.borderStrong}`,
  background: "radial-gradient(circle at 30% 30%, rgba(243,224,182,0.28), rgba(200,169,108,0.12))",
  color: colors.primaryLight,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  fontWeight: 800,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const
 },
 placeholderTitle: {
  color: colors.textPrimary,
  fontSize: "18px",
  fontWeight: 800
 },
 placeholderText: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  maxWidth: "320px"
 },
 actionRow: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: spacing.sm,
  marginTop: spacing.md
 },
 secondaryAction: {
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  padding: "12px 16px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
 },
 tertiaryAction: {
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
  background: "transparent",
  color: colors.primaryLight,
  padding: "12px 16px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
 },
 infoRow: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: spacing.sm,
  marginTop: spacing.md
 },
 infoChip: {
  padding: "8px 12px",
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textMuted,
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontWeight: 700
 },
 footerCard: (useSingleColumnLayout: boolean) => ({
  marginTop: spacing.lg,
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  display: "flex",
  justifyContent: "space-between",
  alignItems: useSingleColumnLayout ? "stretch" : "center",
  flexDirection: useSingleColumnLayout ? "column" as const : "row" as const,
  gap: spacing.lg,
  flexWrap: "wrap" as const
 }),
 footerTitle: {
  color: colors.textPrimary,
  fontSize: "18px",
  fontWeight: 800,
  marginBottom: spacing.xs
 },
 footerText: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  maxWidth: "560px"
 }
}
