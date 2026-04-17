"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useNavigate } from "@/navigation/useAppNavigation";
import type { MembershipDuration, UserGender, UserStatus } from "@/types/domain";
import { useUserStore } from "@/store/userStore";
import { calculateAgeFromDateOfBirth } from "@/utils/dateOfBirth";
import Container from "../../layout/Container";
import PhoneInput from "../../components/inputs/PhoneInput";
import { colors, radius, shadow, typography } from "../../styles/GlobalStyles";
import {
 DEFAULT_PHONE_COUNTRY_CODE,
 getPhoneDocumentId,
 normalizeCountryCode,
 normalizePhoneNumber,
 validatePhoneNumber
} from "../../utils/validation";

const PHONE_LOOKUP_TIMEOUT_MS = 8000

type ExistingUser = {
  name?: string;
  phone?: string;
  countryCode?: string;
  dateOfBirth?: string;
  referenceSource?: string;
  age?: number | null;
  gender?: UserGender;
  lookingFor?: string;
  experience?: string;
  injury?: boolean;
  injuryDetails?: string;
  exerciseType?: string;
  program?: string;
  plan?: string;
  duration?: MembershipDuration;
  price?: number;
  batchType?: string;
  batchTime?: string;
  batchDate?: string;
  profilePhotoUrl?: string;
  profilePhotoStoragePath?: string;
  profilePhotoHash?: string;
  profilePhotoUploadedAt?: string;
  profilePhotoSource?: "camera" | "gallery" | "";
  selectedAddOnIds?: string[];
  mainPlanPrice?: number;
  followUp?: {
    date?: string;
    time?: string;
  } | null;
  purpose?: "trial" | "enroll" | "renew" | "enquiry";
  status?: UserStatus;
};

export default function PhoneCheckScreen() {
  const navigate = useNavigate();
  const { setData, reset, countryCode: storedCountryCode } = useUserStore();
  const isMountedRef = useRef(true);

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState(
    storedCountryCode || DEFAULT_PHONE_COUNTRY_CODE
  );
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const phoneValidation = useMemo(
    () => validatePhoneNumber(phone, countryCode),
    [phone, countryCode]
  );
  const isValidPhone = phoneValidation.isValid;
  const showContinueLoader = isChecking && isValidPhone;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getPhoneLookupErrorMessage = (err: unknown) => {
    if (typeof err === "object" && err && "code" in err) {
      const code = String((err as { code?: unknown }).code ?? "")

      if (code.includes("permission-denied")) {
        return "Phone lookup is blocked right now. Please try again."
      }

      if (
        code.includes("unavailable") ||
        code.includes("deadline-exceeded") ||
        code.includes("resource-exhausted")
      ) {
        return "Phone check is taking too long. Please check internet and try again."
      }

      return `Phone lookup failed (${code || "unknown"}). Please try again.`
    }

    return "Phone number check karne me issue aaya. Please try again."
  }

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          const timeoutError = new Error("Phone lookup timed out")
          ;(timeoutError as Error & { code?: string }).code = "deadline-exceeded"
          reject(timeoutError)
        }, timeoutMs)
      })

      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }

  const handlePhoneChange = (value: string) => {
    setPhone(value)

    if (error) {
      setError("")
    }
  }

  const handleCountryCodeChange = (value: string) => {
    setCountryCode(normalizeCountryCode(value))

    if (error) {
      setError("")
    }
  }

  const handleContinue = async () => {
    if (!isValidPhone || isChecking) return;

    const userDocId = getPhoneDocumentId(
      phoneValidation.normalizedPhone,
      phoneValidation.countryCode
    );

    try {
      setIsChecking(true);
      setError("");

      const userRef = doc(db, "users", userDocId);
      const snap = await withTimeout(getDoc(userRef), PHONE_LOOKUP_TIMEOUT_MS);

      if (snap.exists()) {
        const data = snap.data() as ExistingUser;
        const resolvedAge =
          typeof data.age === "number"
           ? data.age
           : calculateAgeFromDateOfBirth(data.dateOfBirth ?? "")
        const resolvedCountryCode = normalizeCountryCode(
          data.countryCode ?? phoneValidation.countryCode
        )
        const resolvedStatus = data.status ?? "new"
        const resolvedStatusFromPurpose =
          data.purpose === "enquiry"
           ? "enquiry"
           : data.purpose === "trial"
            ? "trial"
            : data.purpose === "enroll" || data.purpose === "renew"
             ? "member"
             : resolvedStatus
        const nextStatus = resolvedStatus !== "new" ? resolvedStatus : resolvedStatusFromPurpose
        const purposeMatchesStatus =
          (nextStatus === "trial" && data.purpose === "trial") ||
          (nextStatus === "member" && (data.purpose === "enroll" || data.purpose === "renew")) ||
          (nextStatus === "enquiry" && data.purpose === "enquiry")
        const resolvedPurpose = purposeMatchesStatus
          ? data.purpose
          : nextStatus === "enquiry"
           ? "enquiry"
           : nextStatus === "trial"
            ? "trial"
            : nextStatus === "member"
             ? "renew"
             : (data.purpose ?? "")

        reset();
        setData({
          phone: normalizePhoneNumber(data.phone ?? phoneValidation.normalizedPhone, resolvedCountryCode),
          countryCode: resolvedCountryCode,
          name: data.name ?? "",
          dateOfBirth: data.dateOfBirth ?? "",
          age: resolvedAge,
          purpose: resolvedPurpose,
          gender: data.gender ?? "",
          lookingFor: data.lookingFor ?? "",
          referenceSource: data.referenceSource ?? "",
          followUpDate:
            typeof data.followUp === "object" && data.followUp ? data.followUp.date ?? "" : "",
          followUpTime:
            typeof data.followUp === "object" && data.followUp ? data.followUp.time ?? "" : "",
          experience: data.experience ?? "",
          injury: typeof data.injury === "boolean" ? data.injury : false,
          injuryAnswered: true,
          injuryDetails: data.injuryDetails ?? "",
          exerciseType: data.exerciseType ?? "",
          program: data.program ?? "",
          plan: data.plan ?? "",
          duration: data.duration ?? "",
          price: typeof data.price === "number" ? data.price : 0,
          selectedAddOnIds: Array.isArray(data.selectedAddOnIds)
           ? data.selectedAddOnIds.filter((item): item is string => typeof item === "string")
           : [],
          mainPlanPrice: typeof data.mainPlanPrice === "number" ? data.mainPlanPrice : 0,
          batchType: data.batchType ?? "",
          batchTime: data.batchTime ?? "",
          batchDate: data.batchDate ?? "",
          profilePhotoUrl: data.profilePhotoUrl ?? "",
          profilePhotoStoragePath: data.profilePhotoStoragePath ?? "",
          profilePhotoHash: data.profilePhotoHash ?? "",
          profilePhotoUploadedAt: data.profilePhotoUploadedAt ?? "",
          profilePhotoSource:
           data.profilePhotoSource === "camera" || data.profilePhotoSource === "gallery"
            ? data.profilePhotoSource
            : "",
          status: nextStatus
        });

        navigate("/return-user", { replace: true });
        return;
      }

      reset();
      setData({
        phone: phoneValidation.normalizedPhone,
        countryCode: phoneValidation.countryCode,
        purpose: "enquiry",
        status: "enquiry"
      });

      navigate("/user-details");
    } catch (err) {
      console.error("Phone check failed:", err);
      if (!isMountedRef.current) return;
      setError(getPhoneLookupErrorMessage(err));
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  };

  return (
    <Container centerContent>
      <div
        style={{
          width: "100%",
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(4px, 1.2vh, 14px) 0",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "min(100%, 560px)",
            padding: "clamp(20px, 3.2vh, 30px)",
            borderRadius: radius.lg,
            border: `1px solid ${colors.borderStrong}`,
            background:
              "radial-gradient(circle at top right, rgba(243,224,182,0.12), transparent 28%), linear-gradient(160deg, rgba(17,28,35,0.96), rgba(8,15,20,0.94))",
            boxShadow: shadow.modal,
            color: colors.textPrimary,
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 22 }}>
           

            <h1 style={{ ...typography.subtitle, margin: "10px 0 0", fontSize: "clamp(28px, 4vw, 38px)" }}>
              Enter Phone Number
            </h1>

           
          </div>

          <PhoneInput
            label="Mobile Number"
            countryCode={countryCode}
            phone={phone}
            placeholder="Enter mobile number"
            onCountryCodeChange={handleCountryCodeChange}
            onPhoneChange={handlePhoneChange}
            compact
          />

          <div style={{ marginTop: 14, minHeight: 28, textAlign: "center" }}>
            {phone.length > 0 && !isValidPhone && (
              <p style={{ margin: 0, color: "#F1A596", fontSize: 14 }}>
                {phoneValidation.error}
              </p>
            )}

            {error && (
              <p style={{ margin: 0, color: "#F87171", fontSize: 14 }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!isValidPhone || isChecking}
            style={{
              marginTop: 20,
              width: "100%",
              height: 52,
              border: "none",
              borderRadius: radius.md,
              background: !isValidPhone || isChecking ? "rgba(255,255,255,0.12)" : colors.primary,
              color: !isValidPhone || isChecking ? colors.textMuted : colors.textOnAccent,
              fontSize: 16,
              fontWeight: 700,
              cursor: !isValidPhone || isChecking ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10
            }}
            aria-busy={showContinueLoader}
          >
            {showContinueLoader && (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "rgba(255,255,255,0.95)",
                    animation: "phone-check-spin 0.8s linear infinite"
                  }}
                />
                <span>Checking</span>
              </>
            )}

            {!showContinueLoader && <span>Continue</span>}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes phone-check-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Container>
  );
}
