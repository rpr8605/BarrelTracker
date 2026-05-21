# Still Product Specification

## Mission
Still is a distillery operating system that connects the production floor to the front of house, providing decision-grade insights and ensuring compliance readiness.

## Core Architecture
Still uses a multi-tenant architecture backed by Supabase (PostgreSQL with RLS). The system is built with Next.js App Router and focuses on a "mobile-first floor OS" philosophy.

## Modules

### 1. Dashboard (The Command Center)
The dashboard provides a high-level summary of the distillery's state across 8 key areas:
- **Productivity Snapshot**: Real-time production efficiency and aging velocity.
- **Action Center**: Centralized decisions and alerts.
- **Barrel Repository**: Full inventory navigation and quick views.
- **Operations**: Station health and active workstreams.
- **Release Pipeline**: Go-to-market status.
- **Finance**: Asset valuation and financial blockers.
- **Compliance Hub**: Regulatory readiness and verification.
- **Engagement Book**: Consumer-facing campaign performance.

### 2. Barrel Lifecycle
Still tracks barrels through 12 distinct stages from creation to retirement.
- **Scanning**: Native NFC/QR support for hardware-linked records.
- **Logging**: Fast-action logging for proof, volume, movement, and tasting.
- **Intelligence**: AI-extracted flavor profiles from voice notes and angel's share estimations.

### 3. Action Center
A source-agnostic decision inbox. Items are detected automatically based on rule sets (e.g., missing data, overdue tasks, location mismatches) and assigned to specific operators.

### 4. Reports Portal
A standalone engine for generating, scheduling, and sharing over 20 types of distillery reports. Features an automated daily snapshot run at 6:03 AM.

### 5. AI Assistant (Ask Still)
A context-aware assistant that understands the distillery's operational history. It can summarize complex reports, explain compliance gaps, and draft marketing plays.

## Demo Scenario: Hearth & Hollow
- **Organization**: Mid-size distillery/blender in Nashville, TN.
- **Scale**: 600 active barrels, 3 rackhouses, 8 active production batches.
- **Team**: William (Owner), Danielle (CEO), Nancy (Compliance), Amanda (Blender), Gareth (Production), Ryan (Admin).
- **Core Narrative**: Managing a high-growth distillery while ensuring every drop is accounted for and every release is optimized for value.
