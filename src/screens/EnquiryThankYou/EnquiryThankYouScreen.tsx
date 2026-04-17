import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { TRIAL_FEE } from "../../utils/trialPricing"

export default function EnquiryThankYouScreen() {
    const navigate = useNavigate()
    const {
        program,
        days,
        duration,
        batchType,
        batchTime,
        batchDate
    } = useUserStore()
    const setData = useUserStore((state) => state.setData)

    const startTrial = () => {
        setData({
            purpose: "trial",
            status: "trial",
            program,
            days,
            duration: "1 Day",
            price: TRIAL_FEE,
            mainPlanPrice: TRIAL_FEE,
            selectedAddOnIds: [],
            batchType,
            batchTime,
            batchDate,
            paymentReference: "",
            paymentMethod: "",
            paymentStatus: ""
        })
        navigate("/payment")
    }

    const startEnroll = () => {
        setData({
            purpose: "enroll",
            status: "member",
            program,
            days,
            duration,
            price: 0,
            batchType,
            batchTime,
            batchDate,
            mainPlanPrice: 0,
            selectedAddOnIds: [],
            paymentReference: "",
            paymentMethod: "",
            paymentStatus: ""
        })
        navigate("/plan")
    }

    return (
        <Container centerContent>
            <div style={styles.wrapper}>
                <div style={styles.card}>
                    <p style={styles.kicker}>Enquiry Submitted</p>

                    <h2 style={styles.heading}>
                        Thank you for enquiring
                    </h2>

                    

                    <div style={styles.buttonGrid}>
                        <button type="button" onClick={startTrial} style={styles.primaryButton}>
                            Book Trial
                        </button>

                        <button type="button" onClick={startEnroll} style={styles.secondaryButton}>
                            Enroll
                        </button>
                    </div>
                </div>
            </div>
        </Container>
    )
}

const styles = {
    wrapper: {
        width: "100%",
        maxWidth: "640px",
        margin: "0 auto"
    },
    card: {
        padding: "28px 24px",
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
        fontSize: "16px",
        marginBottom: spacing.lg
    },
    buttonGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: spacing.sm,
        marginBottom: spacing.md
    },
    primaryButton: {
        minHeight: "50px",
        borderRadius: "999px",
        border: "none",
        background: "linear-gradient(135deg, rgba(200,169,108,0.98), rgba(195,160,93,0.96))",
        color: colors.textOnAccent,
        padding: "12px 18px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        boxShadow: "0 18px 40px rgba(200,169,108,0.22)"
    },
    secondaryButton: {
        minHeight: "50px",
        borderRadius: "999px",
        border: `1px solid ${colors.borderStrong}`,
        background: "rgba(255,255,255,0.04)",
        color: colors.primaryLight,
        padding: "12px 18px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const
    }
}
