import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Hr,
  Section,
} from '@react-email/components'

type MilestoneType = 'peak_approaching' | 'peak_reached' | 'ready_to_bottle'

interface BarrelMilestoneEmailProps {
  barrelNumber: string
  distilleryName: string
  milestoneType: MilestoneType
  barrelUrl: string
}

const MILESTONE_COPY: Record<MilestoneType, { subject: string; heading: string; body: string; cta: string }> = {
  peak_approaching: {
    subject: 'Barrel approaching peak',
    heading: 'Peak aging window approaching',
    body: 'Your barrel is entering its optimal flavor development window. This is the right time to schedule a tasting and monitor closely.',
    cta: 'View Barrel',
  },
  peak_reached: {
    subject: 'Barrel has reached peak',
    heading: 'Peak flavor reached',
    body: 'Your barrel has hit peak maturity based on its aging profile and tasting history. Consider blending or bottling soon to capture it at its best.',
    cta: 'View Barrel',
  },
  ready_to_bottle: {
    subject: 'Barrel ready to bottle',
    heading: 'Ready to bottle',
    body: 'This barrel is ready for bottling. Schedule your bottling run and generate compliance documents from the barrel detail page.',
    cta: 'Start Bottling',
  },
}

export default function BarrelMilestoneEmail({
  barrelNumber,
  distilleryName,
  milestoneType,
  barrelUrl,
}: BarrelMilestoneEmailProps) {
  const copy = MILESTONE_COPY[milestoneType]

  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>Still</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={distilleryLabel}>{distilleryName}</Text>
            <Text style={heading}>{copy.heading}</Text>

            <Section style={barrelBadge}>
              <Text style={barrelBadgeText}>Barrel #{barrelNumber}</Text>
            </Section>

            <Text style={paragraph}>{copy.body}</Text>

            <Section style={buttonWrapper}>
              <Button href={barrelUrl} style={button}>
                {copy.cta}
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>Still — Distillery Management</Text>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#0f0b07',
  fontFamily: 'Georgia, serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '40px 24px',
}

const logoSection: React.CSSProperties = {
  marginBottom: '32px',
}

const logoText: React.CSSProperties = {
  color: '#BA7517',
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  textTransform: 'uppercase',
  margin: 0,
}

const contentSection: React.CSSProperties = {
  backgroundColor: '#1a1208',
  borderRadius: '8px',
  padding: '36px 32px',
  border: '1px solid #2a1f0e',
}

const distilleryLabel: React.CSSProperties = {
  color: '#BA7517',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginTop: 0,
  marginBottom: '8px',
}

const heading: React.CSSProperties = {
  color: '#f5f0e8',
  fontSize: '24px',
  fontWeight: 'bold',
  marginTop: 0,
  marginBottom: '20px',
}

const barrelBadge: React.CSSProperties = {
  backgroundColor: '#2a1f0e',
  borderRadius: '4px',
  display: 'inline-block',
  marginBottom: '20px',
  padding: '8px 16px',
}

const barrelBadgeText: React.CSSProperties = {
  color: '#BA7517',
  fontSize: '14px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: 0,
}

const paragraph: React.CSSProperties = {
  color: '#c4b99a',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '16px',
}

const buttonWrapper: React.CSSProperties = {
  marginTop: '28px',
  textAlign: 'center',
}

const button: React.CSSProperties = {
  backgroundColor: '#BA7517',
  borderRadius: '6px',
  color: '#0f0b07',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
  letterSpacing: '0.5px',
}

const hr: React.CSSProperties = {
  borderColor: '#2a1f0e',
  marginTop: '32px',
  marginBottom: '20px',
}

const footer: React.CSSProperties = {
  color: '#5a4a30',
  fontSize: '13px',
  textAlign: 'center',
  margin: 0,
}
