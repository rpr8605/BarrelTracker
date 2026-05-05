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

interface WelcomeEmailProps {
  name: string
  distilleryName: string
}

export default function WelcomeEmail({ name, distilleryName }: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barrel-tracker.vercel.app'

  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>Still</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={heading}>Welcome to Still, {name}</Text>
            <Text style={paragraph}>
              Your distillery <strong style={highlight}>{distilleryName}</strong> is ready.
              Start logging your first barrel.
            </Text>
            <Text style={paragraph}>
              Track aging, log tasting notes, monitor warehouse conditions, and get AI-powered
              blending recommendations — all in one place.
            </Text>

            <Section style={buttonWrapper}>
              <Button href={`${appUrl}/barrels/new`} style={button}>
                Log Your First Barrel
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

const heading: React.CSSProperties = {
  color: '#f5f0e8',
  fontSize: '24px',
  fontWeight: 'bold',
  marginTop: 0,
  marginBottom: '16px',
}

const paragraph: React.CSSProperties = {
  color: '#c4b99a',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '16px',
}

const highlight: React.CSSProperties = {
  color: '#BA7517',
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
