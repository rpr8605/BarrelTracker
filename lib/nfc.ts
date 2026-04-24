'use client'

export function isNFCSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNDEFReader = any

export async function writeNFCTag(barrelId: string, barrelNumber: string): Promise<void> {
  if (!isNFCSupported()) throw new Error('NFC not supported on this device')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const NDEFReaderClass = (window as any).NDEFReader as new () => AnyNDEFReader
  const ndef = new NDEFReaderClass()
  const url = `${window.location.origin}/barrels/${barrelId}`

  await ndef.write({
    records: [
      { recordType: 'url', data: url },
      { recordType: 'text', data: barrelNumber },
    ],
  })
}

export async function scanNFCTag(): Promise<{ url: string | null; text: string | null }> {
  if (!isNFCSupported()) throw new Error('NFC not supported on this device')

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const NDEFReaderClass = (window as any).NDEFReader as new () => AnyNDEFReader
    const ndef = new NDEFReaderClass()

    ndef.scan().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ndef.onreading = (event: any) => {
        let url: string | null = null
        let text: string | null = null

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const record of event.message.records) {
          const decoder = new TextDecoder()
          if (record.recordType === 'url') url = decoder.decode(record.data)
          if (record.recordType === 'text') text = decoder.decode(record.data)
        }

        resolve({ url, text })
      }
      ndef.onreadingerror = () => reject(new Error('Failed to read NFC tag'))
    }).catch(reject)
  })
}
