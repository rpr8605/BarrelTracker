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

interface ReleaseDropEmailProps {
  distilleryName: string
  dropTitle: string
  description: string
  opensAt: string
  price: string
  dropUrl: string
}

export default function ReleaseDropEmail({
  distilleryName,
  dropTitle,
  description,
  opensAt,
  price,
  dropUrl,
}: ReleaseDropEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>Still</Text>
          </Section>

          <Section style={headerBanner}>
            <Text style={bannerEyebrow}>{distilleryName}</Text>
            <Text style={bannerHeading}>A new release is dropping</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={dropTitleStyle}>{dropTitle}</Text>
            <Text style={paragraph}>{description}</Text>

            <Hr style={divider} />

            <Row style={detailsRow}>
              <Column style={detailCell}>
                <Text style={detailLabel}>Opens</Text>
                <Text style={detailValue}>{opensAt}</Text>
              </Column>
              <Column style={detailCell}>
                <Text style={detailLabel}>Price per bottle</Text>
                <Text style={detailValue}>{price}</Text>
              </Column>
            </Row>

            <Section style={buttonWrapper}>
              <Button href={dropUrl} style={button}>
                Get Early Access
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
  marginBottom: '0',
}

const logoText: React.CSSProperties = {
  color: '#BA7517',
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  textTransform: 'uppercase',
  margin: '0 0 24px',
}

const headerBanner: React.CSSProperties = {
  backgroundColor: '#BA7517',
  borderRadius: '8px 8px 0 0',
  padding: '28px 32px',
}

const bannerEyebrow: React.CSSProperties = {
  color: '#3d1f00',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginTop: 0,
  marginBottom: '6px',
}

const bannerHeading: React.CSSProperties = {
  color: '#0f0b07',
  fontSize: '26px',
  fontWeight: 'bold',
  marginTop: 0,
  marginBottom: 0,
}

const contentSection: React.CSSProperties = {
  backgroundColor: '#1a1208',
  borderRadius: '0 0 8px 8px',
  padding: '32px 32px 36px',
  border: '1px solid #2a1f0e',
  borderTop: 'none',
}

const dropTitleStyle: React.CSSProperties = {
  color: '#f5f0e8',
  fontSize: '20px',
  fontWeight: 'bold',
  marginTop: 0,
  marginBottom: '12px',
}

const paragraph: React.CSSProperties = {
  color: '#c4b99a',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '0',
}

const divider: React.CSSProperties = {
  borderColor: '#2a1f0e',
  marginTop: '24px',
  marginBottom: '24px',
}

const detailsRow: React.CSSProperties = {
  marginBottom: '8px',
}

const detailCell: React.CSSProperties = {
  verticalAlign: 'top',
  width: '50%',
}

const detailLabel: React.CSSProperties = {
  color: '#5a4a30',
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  marginTop: 0,
  marginBottom: '4px',
}

const detailValue: React.CSSProperties = {
  color: '#f5f0e8',
  fontSize: '16px',
  fontWeight: 'bold',
  marginTop: 0,
  marginBottom: 0,
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
