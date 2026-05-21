# UHF RFID Future Module

The Smart Tag data model is pre-architected to support bulk warehouse scanning via Ultra High Frequency (UHF) RFID.

## Data Support
The `asset_tags` table includes a `uhf_epc` field to store the Electronic Product Code (EPC) for the asset.

### RFID Hardware Integration Plan
1. **Bulk Inbound**: Scanning a pallet with a handheld UHF reader will automatically update the status of all child asset tags to 'Active'.
2. **Rickhouse Audit**: Automated inventory reconciliation by scanning rows of barrels and flagging missing tags or location mismatches.
3. **Movements**: Automatically logging warehouse movements when an asset passes through an RFID-enabled portal.

## EPC Strategy
Still recommends using the GS1 SGTIN-96 standard for EPC values to ensure global interoperability and compliance with large retail/distribution chains.
