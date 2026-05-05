import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Hr,
  Section,
  Row,
  Column,
} from '@react-email/components'

type AdoptionTier = 'full' | 'share'

interface AdoptionConfirmEmailProps {
  consumerName: string
  barrelNumber: string
  distilleryName: string
  tier: AdoptionTier
  shareNumber?: number
  passportUrl: string
}

const TIER_LABEL: Record<AdoptionTier, string> = {
  full: 'Full Barrel',
  share: 'Barrel Share',
}

const TIER_DESCRIPTION: Record<AdoptionTier, string> = {
  full: 'You have full ownership of this barrel. You\'ll receive updates as it ages and first access when it\'s ready to bottle.',
  share: 'You own a share of this barrel. As it ages, you\'ll receive tasting notes and updates — and a portion of the final yield when it\'s ready.',
}

export default function AdoptionConfirmEmail({
  consumerName,
  barrelNumber,
  distilleryName,
  tier,
  shareNumber,
  passportUrl,
}: AdoptionConfirmEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>Still</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={eyebrow}>{distilleryName}</Text>
            <Text style={heading}>You've adopted a barrel</Text>
            <Text style={subheading}>Welcome aboard, {consumerName}.</Text>

            <Section style={barrelCard}>
              <Row>
                <Column style={barrelCardLeft}>
                  <Text style={cardLabel}>Barrel</Text>
                  <Text style={cardValue}>#{barrelNumber}</Text>
                </Column>
                <Column style={barrelCardRight}>
                  <Text style={cardLabel}>Tier</Text>
                  <Text style={cardValue}>{TIER_LABEL[tier]}</Text>
                </Column>
              </Row>
              {tier === 'share' && shareNumber != null && (
                <Row style={{ marginTop: '16px' }}>
                  <Column>
                    <Text style={cardLabel}>Your Share</Text>
                    <Text style={cardValue}>Share #{shareNumber}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            <Text style={paragraph}>{TIER_DESCRIPTION[tier]}</Text>

            <Section style={buttonWrapper}>
              <Button href={passportUrl} style={button}>
                View Your Barrel Passport
              </Button>
            </Section>

            <Text style={footnote}>
              Your barrel passport contains the full history, tasting notes, and aging data for
              this barrel. Share it with friends — or keep it to yourself.
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

const eyebrow: React.CSSProperties = {
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
  fontSize: '26px',
  fontWeight: 'bold',
  marginTop: 0,
  marginBottom: '6px',
}

const subheading: React.CSSProperties = {
  color: '#c4b99a',
  fontSize: '16px',
  marginTop: 0,
  marginBottom: '24px',
}

const barrelCard: React.CSSProperties = {
  backgroundColor: '#2a1f0e',
  borderRadius: '6px',
  padding: '20px 20px 20px',
  marginBottom: '24px',
}

const barrelCardLeft: React.CSSProperties = {
  width: '50%',
  verticalAlign: 'top',
}

const barrelCardRight: React.CSSProperties = {
  width: '50%',
  verticalAlign: 'top',
}

const cardLabel: React.CSSProperties = {
  color: '#5a4a30',
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  marginTop: 0,
  marginBottom: '4px',
}

const cardValue: React.CSSProperties = {
  color: '#BA7517',
  fontSize: '18px',
  fontWeight: 'bold',
  marginTop: 0,
  marginBottom: 0,
}

const paragraph: React.CSSProperties = {
  color: '#c4b99a',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '16px',
}

const buttonWrapper: React.CSSProperties = {
  marginTop: '28px',
  marginBottom: '20px',
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

const footnote: React.CSSProperties = {
  color: '#5a4a30',
  fontSize: '13px',
  lineHeight: '1.5',
  textAlign: 'center',
  marginTop: '0',
  marginBottom: '0',
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
