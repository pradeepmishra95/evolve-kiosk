import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytesResumable, type UploadTaskSnapshot } from "firebase/storage"
import { db, storage } from "../firebase/firebase"
import type { ProfilePhotoSource } from "../types/domain"
import { getPhoneDocumentId } from "../utils/validation"

export type ProfilePhotoUploadStage =
 | "preparing"
 | "hashing"
 | "uploading"
 | "getting_download_url"
 | "saving_record"
 | "complete"

export interface UploadProfilePhotoProgress {
 stage: ProfilePhotoUploadStage
 bytesTransferred?: number
 totalBytes?: number
 progressPercent?: number
}

export interface UploadProfilePhotoInput {
 name: string
 phone: string
 countryCode: string
 source: ProfilePhotoSource
 blob: Blob
 fileName?: string
 contentType?: string
 onProgress?: (progress: UploadProfilePhotoProgress) => void
}

export interface UploadProfilePhotoResult {
 userId: string
 storagePath: string
 downloadUrl: string
 uploadedAt: string
 hash: string
 contentType: string
 source: ProfilePhotoSource
}

const PROFILE_PHOTO_FILE_NAME = "profile-photo.jpg"

export const buildProfilePhotoStoragePath = (userId: string) =>
 `profiles/${encodeURIComponent(userId || "unknown")}/${PROFILE_PHOTO_FILE_NAME}`

const toHex = (bytes: ArrayBuffer) =>
 Array.from(new Uint8Array(bytes))
  .map((byte) => byte.toString(16).padStart(2, "0"))
  .join("")

const hashBlob = async (blob: Blob) => {
 if (!globalThis.crypto?.subtle) {
  return ""
 }

 const digest = await globalThis.crypto.subtle.digest("SHA-256", await blob.arrayBuffer())

 return toHex(digest)
}

export const getProfilePhotoUploadStatusMessage = (progress: UploadProfilePhotoProgress) => {
 switch (progress.stage) {
  case "preparing":
   return "Preparing profile photo..."
  case "hashing":
   return "Preparing secure photo upload..."
  case "uploading":
   return typeof progress.progressPercent === "number"
    ? `Uploading to storage... ${progress.progressPercent}%`
    : "Uploading to storage..."
  case "getting_download_url":
   return "Fetching secure photo link..."
  case "saving_record":
   return "Saving member record..."
  case "complete":
   return "Profile photo saved."
  default:
   return "Uploading profile photo..."
 }
}

export const uploadProfilePhoto = async (input: UploadProfilePhotoInput): Promise<UploadProfilePhotoResult> => {
 if (!input.name.trim()) {
  throw new Error("Member name is required before saving a profile photo.")
 }

 if (!input.phone.trim()) {
  throw new Error("Member phone is required before saving a profile photo.")
 }

 const userId = getPhoneDocumentId(input.phone, input.countryCode)

 if (!userId) {
  throw new Error("Could not resolve the member record for this photo.")
 }

 input.onProgress?.({
  stage: "preparing",
  progressPercent: 0
 })

 const storagePath = buildProfilePhotoStoragePath(userId)
 const photoRef = ref(storage, storagePath)
 const contentType = input.contentType || input.blob.type || "image/jpeg"
 input.onProgress?.({
  stage: "hashing"
 })
 const hash = await hashBlob(input.blob)
 const uploadedAt = new Date().toISOString()

 input.onProgress?.({
  stage: "uploading",
  bytesTransferred: 0,
  totalBytes: input.blob.size,
  progressPercent: 0
 })

 const uploadTask = uploadBytesResumable(photoRef, input.blob, {
  contentType,
  customMetadata: {
   userId,
   name: input.name,
   phone: input.phone,
   countryCode: input.countryCode,
   source: input.source,
   uploadedAt,
   hash,
   fileName: input.fileName || PROFILE_PHOTO_FILE_NAME
  }
 })

 const uploadResult = await new Promise<UploadTaskSnapshot>((resolve, reject) => {
  uploadTask.on(
   "state_changed",
   (snapshot) => {
    const totalBytes = snapshot.totalBytes || input.blob.size || 0
    const progressPercent = totalBytes
     ? Math.round((snapshot.bytesTransferred / totalBytes) * 100)
     : 0

    input.onProgress?.({
     stage: "uploading",
     bytesTransferred: snapshot.bytesTransferred,
     totalBytes,
     progressPercent
    })
   },
   (error) => {
    reject(error)
   },
   () => {
    resolve(uploadTask.snapshot)
   }
  )
 })

 input.onProgress?.({
  stage: "getting_download_url",
  progressPercent: 100
 })
 const downloadUrl = await getDownloadURL(uploadResult.ref)

 input.onProgress?.({
  stage: "saving_record",
  progressPercent: 100
 })
 await setDoc(
  doc(db, "users", userId),
  {
   name: input.name,
   phone: input.phone,
   countryCode: input.countryCode,
   profilePhotoUrl: downloadUrl,
   profilePhotoStoragePath: storagePath,
   profilePhotoHash: hash,
   profilePhotoUploadedAt: uploadedAt,
   profilePhotoSource: input.source,
   profilePhotoContentType: contentType,
   profilePhotoFileName: input.fileName || PROFILE_PHOTO_FILE_NAME,
   profilePhotoUpdatedAt: serverTimestamp(),
   updatedAt: serverTimestamp()
  },
  { merge: true }
 )

 input.onProgress?.({
  stage: "complete",
  progressPercent: 100
 })

 return {
  userId,
  storagePath,
  downloadUrl,
  uploadedAt,
  hash,
  contentType,
  source: input.source
 }
}
