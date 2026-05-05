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

interface PasswordResetEmailProps {
  resetUrl: string
}

export default function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>Still</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={heading}>Reset your Still password</Text>
            <Text style={paragraph}>
              Click the button below to set a new password. This link expires in{' '}
              <strong style={highlight}>1 hour</strong>.
            </Text>

            <Section style={buttonWrapper}>
              <Button href={resetUrl} style={button}>
                Reset Password
              </Button>
            </Section>

            <Text style={disclaimer}>
              If you didn't request this, ignore this email. Your password won't change.
            </Text>
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
  marginBottom: '24px',
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

const disclaimer: React.CSSProperties = {
  color: '#5a4a30',
  fontSize: '13px',
  textAlign: 'center',
  marginTop: '8px',
  marginBottom: 0,
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
