# NFC & QR Tag Workflow

This guide outlines how to physically produce and program Still Smart Tags.

## 1. Create Tag Record
Navigate to **Smart Tags > New Tag** in the Still dashboard. Select the entity type (e.g., Barrel) and technology (e.g., Hybrid NFC+QR).

## 2. Print Label
From the tag detail page, click **Print Label**. This generates a print-optimized SVG label containing:
- Human-readable Asset ID (e.g., `BRL-00382`)
- Smart QR Code
- Visual NFC Tap Zone

## 3. Program NFC Chip (Manual)
If using NFC tags, you must write the `tag_url` to the chip:
1. Copy the **Tag URL** from the Still dashboard.
2. Use an app like **NFC Tools** (iOS/Android).
3. Select **Write > Add a record > URL/URI**.
4. Paste the Still Tag URL.
5. Tap the physical NFC tag to write.

## 4. Verification
Once produced, scan the QR code or tap the NFC tag with a mobile device. 
- Ensure it opens the correct Still record.
- Click **Verify Tag** in the Still dashboard to log the verification audit event.

## 5. Deployment
Affix the label to the barrel or pallet. The tag is now **Active**.
