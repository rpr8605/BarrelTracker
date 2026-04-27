# Still — User Guide
### Francis Distillery & Magnolia Barrel House

---

## Privacy & Data Structure

Before anything else — here is how your data is protected.

| What | How it works |
|---|---|
| **Your barrels** | Stored in a private, encrypted database. Only users you authorize can see them. |
| **Your login** | Username + password. No email required. Credentials never appear in the app UI. |
| **Demo data** | Completely separate from your real data. Exploring the demo cannot touch, change, or expose Francis or Magnolia barrels. |
| **Who has access** | See the table below. Nobody outside this list can log in. |

### Who Can Access What

| Username | Name | Francis Distillery | Magnolia Barrel House | Demo |
|---|---|---|---|---|
| **WFRANCIS** | William Francis | ✅ Full access | ✅ Full access | ✅ Full access |
| **DFRANCIS** | Danielle Francis | ✅ Full access | ✅ Full access | ✅ Full access |
| **RRUSSELL** | Ryan Russell | ✅ Full access | ✅ Full access | — |
| **GASH** | Gareth Ash | — | — | 👁 Read only |

> **Full access** — can add, edit, delete barrels, upload photos, record voice notes, run reports.
> **Read only** — can browse and search but cannot make changes.
> **—** — no access at all. That distillery is invisible to them.

---

## Logging In

Open the app at:

> **https://barrel-tracker-rpr8605s-projects.vercel.app**

Save this to your home screen for one-tap access (instructions at the bottom of this guide).

---

### Step 1 — Choose Your Environment

The first thing you see is the **Environment** dropdown at the top of the login card.

```
┌─────────────────────────────────┐
│  Still                          │
│  Distillery management          │
│                                 │
│  Environment                    │
│  ┌───────────────────────────┐  │
│  │ Demo — Explore the app  ▾ │  │
│  └───────────────────────────┘  │
│                                 │
│  Your name                      │
│  ┌───────────────────────────┐  │
│  │ Enter any name            │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │      Enter Demo           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**[ Screenshot: Login screen — Demo selected ]**

The dropdown contains:

| Option | What it is |
|---|---|
| **Demo — Explore the app** | 500 practice barrels. No password. No real data. |
| **Francis Distillery** | William & Danielle's private barrel house. |
| **Magnolia Barrel House** | Second barrel house. William & Danielle. |
| Russell's Reserve | Shown for appearance — no accounts exist here. |
| Blue Ridge Virginia | Shown for appearance — no accounts exist here. |

---

### Scenario A — Exploring the Demo

Use this first. Get comfortable with the app before touching real data.

1. Open the app.
2. Leave the dropdown on **Demo — Explore the app**.
3. Type **any name** in the "Your name" box — it can be anything.
4. Tap **Enter Demo**.

**[ Screenshot: Demo login screen with name filled in ]**

You are now inside a demo distillery with 500 barrels. Everything works — search, filters, voice notes, photos, reports. None of it is real data. You can add, edit, or delete freely without consequence.

---

### Scenario B — Logging Into Francis Distillery

1. Open the app.
2. Tap the **Environment** dropdown → select **Francis Distillery**.
3. Enter your **username** (WFRANCIS or DFRANCIS).
4. Enter your **password** (provided to you separately).
5. Tap **Sign in**.

**[ Screenshot: Login screen — Francis selected, username/password fields visible ]**

You will land on the Francis Distillery dashboard showing your real barrels.

---

### Scenario C — Logging Into Magnolia Barrel House

Same steps as Francis, but choose **Magnolia Barrel House** from the dropdown.

1. Tap the **Environment** dropdown → select **Magnolia Barrel House**.
2. Enter your username and password (same credentials as Francis).
3. Tap **Sign in**.

**[ Screenshot: Login screen — Magnolia selected ]**

---

### Switching Between Distilleries (Without Logging Out)

Once you're inside the app, you can switch between Francis and Magnolia without logging out.

Look for the **distillery name** near the top of the left sidebar (or the menu on mobile). Tap it to reveal a switcher dropdown.

```
┌────────────────────┐
│ Francis Distillery │
│ Magnolia Barrel ▾  │  ← tap here
└────────────────────┘
```

**[ Screenshot: Distillery switcher dropdown open ]**

Tap the other distillery name. The app reloads showing that distillery's barrels. Your login session stays active — you don't need to re-enter your password.

---

### Face ID / Touch ID (Optional — Set Up After First Login)

After signing in with your password the first time, you can enable biometric login for future sessions.

1. Tap the menu → **Settings**.
2. Scroll to **Security**.
3. Tap **Enable Face ID** (iPhone) or **Enable fingerprint** (Android).
4. Follow the device prompt to confirm.

**[ Screenshot: Settings → Security section ]**

On your next visit, a **Sign in with Face ID** button will appear on the login screen beneath the regular sign-in button. Tap it — the app will authenticate without a password.

> Face ID and Touch ID are stored entirely on your device. The app never sees your biometric data.

---

## Using the App

### Dashboard

The dashboard is your home screen. It shows:

- **Total barrels** in the current distillery
- **Ready to bottle** — barrels estimated at peak
- **Aging** — still maturing
- **Bottled / Dumped** — historical

**[ Screenshot: Dashboard — summary cards ]**

Tap any card to jump directly to that filtered barrel list.

---

### Browsing Barrels

Tap **Barrels** in the bottom nav (mobile) or left sidebar (desktop).

**[ Screenshot: Barrel list view ]**

You'll see a scrollable list of barrels. Each row shows:

- Barrel number
- Mash bill (grain recipe)
- Status (Aging / Ready / Bottled)
- Age

**Tap any barrel** to open its full detail card.

---

### Filtering & Searching

At the top of the barrel list, tap the **search bar** and type anything — barrel number, grain type, flavor tag, warehouse location, etc.

Tap the **filter icon** (sliders) to narrow by:
- Status
- Finish type (Port, Sherry, Double Oaked…)
- Entry year
- Warehouse row/tier

**[ Screenshot: Search bar active with results ]**

---

### Adding a New Barrel

Tap the **+** button (top right of the barrel list or bottom-right floating button on mobile).

**[ Screenshot: New barrel button ]**

Fill in the details:

| Field | What to enter |
|---|---|
| Barrel Number | Your barrel ID (e.g. MAG-001) |
| Mash Bill | Grain recipe (e.g. 72% Corn, 18% Rye) |
| Source Distillery | Where it was made |
| Entry Date | When it went into the barrel |
| Entry Proof | Proof at fill |
| Warehouse | Row, slot, and tier |
| Finish Type | None, Port, Sherry, etc. |
| Tags | Flavor notes |

**Shortcut — Scan a Label:**
Tap the **camera icon** inside the new barrel form. Point your phone camera at the barrel label or paperwork. The app reads the text and fills in the fields automatically. Review and tap **Apply**.

**[ Screenshot: Label scanner camera view ]**

**[ Screenshot: Extracted fields after scan ]**

---

### Barrel Detail Page

Tap a barrel to see its full record.

**[ Screenshot: Barrel detail — top section ]**

Sections on the detail page:

- **Header** — barrel number, status badge, age
- **Specs** — mash bill, proof, warehouse location
- **Tags** — flavor profile tags (tap + to add more)
- **Predicted Peak** — AI estimate of when it's ready
- **Photos** — up to 3 photos. Tap the camera icon to add.
- **Voice Notes** — tap the microphone to record a note. The app transcribes it and extracts flavor tags automatically.
- **History** — log of all changes

**[ Screenshot: Barrel detail — photos and voice note section ]**

---

### Recording a Voice Note

On any barrel detail page:

1. Tap the **microphone icon**.
2. Speak your tasting note — e.g. *"Nice vanilla on the nose, little bit of oak, good color, I think this one's getting close."*
3. Tap **Stop**.

The app sends the recording to AI, which:
- Transcribes the note
- Extracts flavor tags (vanilla, oak, etc.) and suggests adding them to the barrel
- Saves the note with a timestamp

**[ Screenshot: Voice note recording in progress ]**

**[ Screenshot: Transcribed note with extracted tags ]**

---

### Warehouse Heat Map

Tap **Warehouse** in the nav.

**[ Screenshot: Warehouse grid view ]**

The heat map shows your warehouse laid out by row and tier. Color coding:

- 🟢 Green — barrel is aging normally
- 🟡 Yellow — approaching peak
- 🔴 Red — at or past predicted peak
- ⬜ Gray — empty slot

Tap any cell to jump to that barrel.

---

### AI Blending Suggestions

Tap **Blend** in the nav.

The app analyzes your barrel inventory and suggests combinations based on complementary flavor profiles. Each suggestion shows:

- Which barrels to combine
- Expected flavor profile of the blend
- Estimated yield

**[ Screenshot: Blend suggestions page ]**

Tap **Create Batch** on any suggestion to turn it into a tracked batch.

---

### Batches

Tap **Batches** to see all blends and bottling runs.

**[ Screenshot: Batch list ]**

Each batch tracks:
- Which barrels were used
- Total yield
- Bottling date
- Story page (shareable link — see below)

---

### Story Mode (Sharing a Batch)

Open any batch → tap **Share Story**.

This generates a public-facing page with a clean summary of the batch: the barrels, the blend rationale, and tasting notes. Safe to share with customers or on social media. It shows only what you choose — no pricing, no private data.

**[ Screenshot: Story page as customer sees it ]**

---

### Compliance Reports

Tap **Compliance** in the nav.

**[ Screenshot: Compliance page ]**

Generate TTB-formatted production reports. Select a date range, choose the report type, and tap **Generate**. The report is formatted for TTB submission and can be downloaded as a PDF.

---

### Settings

Tap **Settings** in the nav.

**[ Screenshot: Settings page ]**

Key options:

- **Account** — change your display name
- **Security** — enable/disable Face ID or Touch ID
- **Distillery** — view distillery info
- **Sign out**

---

## Add the App to Your Home Screen

### iPhone (Safari)

1. Open the app in Safari.
2. Tap the **Share** button (box with arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

The app icon appears on your home screen and opens full-screen, like a native app.

**[ Screenshot: iOS Add to Home Screen dialog ]**

### Android (Chrome)

1. Open the app in Chrome.
2. Tap the **three-dot menu** (top right).
3. Tap **Add to Home screen**.
4. Tap **Add**.

---

## Quick Reference

| What you want to do | How |
|---|---|
| Browse demo barrels | Login → Demo environment → any name |
| Access Francis | Login → Francis Distillery → WFRANCIS or DFRANCIS |
| Access Magnolia | Login → Magnolia Barrel House → same credentials |
| Switch distilleries | Sidebar → distillery name dropdown |
| Add a barrel | Barrels → + button |
| Scan a label | New barrel form → camera icon |
| Record a tasting note | Barrel detail → microphone icon |
| See warehouse layout | Warehouse tab |
| Get blend ideas | Blend tab |
| Run a report | Compliance tab |
| Enable Face ID | Settings → Security |

---

*Questions or access issues — contact Ryan Russell.*
