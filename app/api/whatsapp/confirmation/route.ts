import { NextResponse } from "next/server"
import { validatePhoneNumber } from "@/utils/validation"

interface ConfirmationRequestBody {
 phone?: string
 countryCode?: string
 name?: string
 purpose?: string
 program?: string
 duration?: string
 batchType?: string
 batchTime?: string
}

const getTemplateName = (purpose: string) => {
 if (purpose === "trial") {
  return process.env.WHATSAPP_TRIAL_TEMPLATE_NAME?.trim() || ""
 }

 if (purpose === "enroll" || purpose === "renew") {
  if (purpose === "renew") {
   return process.env.WHATSAPP_RENEW_TEMPLATE_NAME?.trim() || process.env.WHATSAPP_ENROLL_TEMPLATE_NAME?.trim() || ""
  }

  return process.env.WHATSAPP_ENROLL_TEMPLATE_NAME?.trim() || ""
 }

 return ""
}

const getMetaConfig = (purpose: string) => {
 const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || ""
 const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || ""
 const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v23.0"
 const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE_CODE?.trim() || "en_US"
 const templateName = getTemplateName(purpose)

 return {
  accessToken,
  phoneNumberId,
  apiVersion,
  languageCode,
  templateName
 }
}

const isConfigured = (config: ReturnType<typeof getMetaConfig>) =>
 Boolean(config.accessToken && config.phoneNumberId && config.templateName)

const buildTemplateParameters = (payload: ConfirmationRequestBody) => [
 { type: "text", text: payload.name?.trim() || "Member" },
 { type: "text", text: payload.program?.trim() || "-" },
 { type: "text", text: payload.duration?.trim() || "-" },
 { type: "text", text: payload.batchTime?.trim() || payload.batchType?.trim() || "-" }
]

export async function POST(request: Request) {
 const payload = await request.json() as ConfirmationRequestBody
 const purpose = payload.purpose?.trim() || ""
 const phoneValidation = validatePhoneNumber(payload.phone || "", payload.countryCode || "")

 if (purpose !== "trial" && purpose !== "enroll" && purpose !== "renew") {
  return NextResponse.json(
   { ok: false, error: "WhatsApp confirmation is only supported for trial, enroll, and renew flows." },
   { status: 400 }
  )
 }

 if (!phoneValidation.isValid) {
  return NextResponse.json(
   { ok: false, error: phoneValidation.error },
   { status: 400 }
  )
 }

 const config = getMetaConfig(purpose)

 if (!isConfigured(config)) {
  return NextResponse.json({
   ok: true,
   skipped: true,
   reason: "whatsapp_not_configured"
  })
 }

 const response = await fetch(
  `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
  {
   method: "POST",
   headers: {
    Authorization: `Bearer ${config.accessToken}`,
    "Content-Type": "application/json"
   },
   body: JSON.stringify({
    messaging_product: "whatsapp",
    to: phoneValidation.phoneWithCountryCode,
    type: "template",
    template: {
     name: config.templateName,
     language: {
      code: config.languageCode
     },
     components: [
      {
       type: "body",
       parameters: buildTemplateParameters(payload)
      }
     ]
    }
   })
  }
 )

 const result = await response.json().catch(() => null)

 if (!response.ok) {
  return NextResponse.json(
   {
    ok: false,
    error: "meta_send_failed",
    details: result
   },
   { status: 502 }
  )
 }

 return NextResponse.json({
  ok: true,
  provider: "meta_whatsapp_cloud_api",
  result
 })
}
