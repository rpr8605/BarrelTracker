import { Html, Head, Body, Container, Text, Button, Hr, Section } from '@react-email/components'

interface Props {
  distillery_name: string
  title: string
  summary: string
  action_required: string | null
  effective_date: string | null
  source_url: string
}

export function RegulatoryAlertEmail({ distillery_name, title, summary, action_required, effective_date, source_url }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: '#0f0b07', fontFamily: 'Georgia, serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
          <Text style={{ color: '#BA7517', fontSize: 28, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase', margin: 0 }}>Still</Text>
          <Section style={{ backgroundColor: '#1a1208', borderRadius: 8, padding: '36px 32px', border: '1px solid #2a1f0e', marginTop: 32 }}>
            <Text style={{ color: '#BA7517', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>{distillery_name}</Text>
            <Text style={{ color: '#f5f0e8', fontSize: 22, fontWeight: 'bold', margin: '10px 0 18px' }}>⚠️ TTB Regulatory Update</Text>
            <Text style={{ color: '#f5f0e8', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>{title}</Text>
            <Text style={{ color: '#c4b99a', fontSize: 15, lineHeight: 1.6 }}>{summary}</Text>
            {action_required && (
              <Section style={{ backgroundColor: '#3a1a08', padding: 14, borderRadius: 4, marginTop: 16, borderLeft: '3px solid #BA7517' }}>
                <Text style={{ color: '#f5d088', margin: 0, fontSize: 14, fontWeight: 'bold' }}>Action required</Text>
                <Text style={{ color: '#f5e5c0', margin: '6px 0 0', fontSize: 14 }}>{action_required}</Text>
              </Section>
            )}
            {effective_date && <Text style={{ color: '#c4b99a', fontSize: 13, marginTop: 12 }}>Effective: {effective_date}</Text>}
            <Section style={{ marginTop: 28, textAlign: 'center' }}>
              <Button href={source_url} style={{ backgroundColor: '#BA7517', borderRadius: 6, color: '#0f0b07', display: 'inline-block', fontSize: 15, fontWeight: 'bold', padding: '14px 28px', textDecoration: 'none' }}>
                Read full Federal Register article
              </Button>
            </Section>
          </Section>
          <Hr style={{ borderColor: '#2a1f0e', marginTop: 32, marginBottom: 20 }} />
          <Text style={{ color: '#5a4a30', fontSize: 13, textAlign: 'center', margin: 0 }}>Still — Compliance assistance for craft distilleries</Text>
        </Container>
      </Body>
    </Html>
  )
}
