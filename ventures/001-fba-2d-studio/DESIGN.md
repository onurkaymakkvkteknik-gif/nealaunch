# DESIGN SYSTEM & ARCHITECTURE CONTRACT: AMAZON FBA 2D BARCODE & MARGIN STUDIO

## 1. BANNED AI-SLOP PATTERNS (STRICTLY PROHIBITED)
- NO generic purple/blue neon gradients (`bg-gradient-to-r from-blue-500 to-purple-600` is forbidden).
- NO 3-card generic marketing feature grids ("Fast / Secure / Easy" with generic Lucide icons).
- NO fake customer reviews, fake "Loved by 10,000+ sellers" badges, or AI marketing filler ("Unlock the power of...", "Seamlessly streamline...").
- NO dead `<textarea>` or skeleton placeholder uploaders without instant live parsing.

## 2. LINEAR / RAYCAST / STRIPE INDUSTRIAL PRECISION AESTHETIC
- **Surface & Hierarchy:**
  - Background Canvas: Carbon Slate `#09090B`
  - Elevated Workspaces & Panels: `#121215` (1px solid `#27272A` hairline border)
  - Interactive Hover / Active States: `#18181B` border `#3F3F46`
  - High-Contrast Text: Primary `#FAFAFA`, Muted Secondary `#A1A1AA`, Subtle Code `#71717A`
- **Functional Semantic Accents:**
  - Valid / Compliant: Emerald `#10B981` (badge background `#064E3B`, border `#059669`)
  - Warning / FBA Fee Risk: Amber `#F59E0B` (badge background `#78350F`, border `#D97706`)
  - Spec Violation / Missing PO: Rose `#F43F5E` (badge background `#881337`, border `#E11D48`)
  - Active Accent: Pure White `#FFFFFF` / Zinc `#F4F4F5`
- **Typography:**
  - UI Labels & Controls: System San-Serif / `Inter`, 11px-13px, weight 500/600.
  - Data Grid, SKUs, ASINs, Barcode Payloads, Dimensions: `JetBrains Mono` / monospace with `tabular-nums`.
- **Above-The-Fold Workspace Rule:**
  - Viewport at 1440x900 opens directly into the live split-pane studio preloaded with real 15-row Amazon FBA shipment box data. Zero marketing scroll required before interaction.

## 3. SPLIT-PANE DESKTOP ARCHITECTURE
- **Left Pane (58% width):** High-density editable catalog spreadsheet (Box ID, Shipment ID, FNSKU, SKU, Title, Qty, Expiration, Margin %).
- **Right Pane (42% width):** Real-time WYSIWYG 4x6 inch (101.6 x 152.4 mm) 300-DPI thermal label canvas rendering official Amazon PDF417 / Data Matrix 2D barcodes (`AMZN,PO:...`) + Code128 FNSKU + live unit margin stamp.

## 4. DETERMINISTIC 4-GATE & 5-AUDIT ENFORCEMENT
- Gate 1: Anti-slop copy & zero-gradient audit
- Gate 2: 4-breakpoint geometry pass (1440px, 1024px, 768px, 390px)
- Gate 3: Binary output test (PDF > 10KB, `%PDF-1.`)
- Gate 4: Zero secrets or pro module leaks in bundle
- Gate 5: TypeScript zero error + client-side compute $0 cost

