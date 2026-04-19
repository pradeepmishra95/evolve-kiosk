import { useEffect } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"

export default function EnquiryThankYouScreen() {
    const navigate = useNavigate()
    const reset = useUserStore((state) => state.reset)

    useEffect(() => {
        const timer = window.setTimeout(() => {
            reset()
            navigate("/", { replace: true })
        }, 1800)

        return () => window.clearTimeout(timer)
    }, [navigate, reset])

    return (
        <Container centerContent>
            <div style={styles.wrapper}>
                <div style={styles.card}>
                    <p style={styles.kicker}>Enquiry Submitted</p>

                    <h2 style={styles.heading}>
                        Thank you for visiting
                    </h2>

                    <p style={styles.body}>
                        We&apos;ve noted your details and will be in touch soon. Do visit again!
                    </p>

                    <div style={styles.actions}>
                        <PrimaryButton
                            title="Back To Welcome"
                            onClick={() => {
                                reset()
                                navigate("/", { replace: true })
                            }}
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
        maxWidth: "560px",
        margin: "0 auto"
    },
    card: {
        padding: "36px 28px",
        borderRadius: radius.lg,
        border: `1px solid ${colors.border}`,
        background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
        boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
        textAlign: "center" as const
    },
    kicker: {
        color: colors.primaryLight,
        letterSpacing: "0.18em",
        textTransform: "uppercase" as const,
        fontSize: "12px",
        fontWeight: 700,
        marginBottom: spacing.sm
    },
    heading: {
        ...typography.subtitle,
        fontSize: "clamp(28px, 4vw, 40px)",
        marginBottom: spacing.md
    },
    body: {
        color: colors.textSecondary,
        lineHeight: 1.7,
        fontSize: "16px"
    },
    actions: {
        marginTop: spacing.lg
    }
}
