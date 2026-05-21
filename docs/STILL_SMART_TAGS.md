# Still Smart Tags

Still Smart Tags turn every barrel, batch, bottle, case, and product into a live digital record. QR today. NFC tomorrow. RFID when the warehouse needs it.

## Architecture Overview

The core philosophy of Still Smart Tags is that the **physical tag should NOT store sensitive data**. The tag (QR, NFC, or RFID) points to one smart Still URL. Still stores and controls everything behind that URL.

### Data Model

- `asset_tags`: The central registry of all smart tags. Links a `public_slug` to an internal `assigned_entity_id`.
- `tag_scan_events`: Tracks every time a tag is scanned, including source (QR/NFC) and viewer type.
- `tag_audit_events`: Full lifecycle tracking of the tag (created -> printed -> verified -> active).
- `compliance_documents`: Attachments and metadata for TTB/ABC records linked to the tagged asset.

## Tag Lifecycle

1. **Draft**: Tag record created but not yet physically produced.
2. **Printed**: Physical label with QR code has been generated.
3. **Written**: (NFC only) Tag URL has been written to the chip.
4. **Verified**: Tag has been scanned and confirmed to point to the correct record.
5. **Active**: Tag is in live operation.
6. **Retired**: Asset is consumed or tag is damaged; record remains for audit but warns visitors.

## Role-Aware Views

The same `tag_url` renders different information based on the viewer:

- **Public**: Basic asset info, producer confirmation, and authenticity badge.
- **Regulator/Distributor**: Compliance snapshot, TTB COLA numbers, state registration IDs.
- **Internal**: Full operational history, warehouse location, audit logs, and management actions.

## Security

- No internal UUIDs are exposed in the `tag_url`; only the `public_slug`.
- RLS policies ensure that only authorized distillery members can see internal notes or management controls.
- Public fields are strictly controlled via the `public_enabled` toggle on each tag.

## Future Roadmap

- **NFC Write Assistant**: In-app tool for programming NFC chips via Web NFC API.
- **UHF RFID Module**: Support for bulk rickhouse scanning and automated inventory reconciliation.
- **Advanced Compliance Packet**: One-click generation of full distributor/ABC disclosure packets.
