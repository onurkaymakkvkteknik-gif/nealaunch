# VENTURE #1 SPECIFICATION: FBA 2D BOX CONTENT BARCODE STUDIO (`001-fba-2d-studio`)

## 1. USER
- **Target Persona:** Amazon FBA 3P private label sellers, wholesale brand aggregators, prep centers, and warehouse logistics teams shipping inbound carton inventory to Amazon Fulfillment Centers.
- **Pain Point:** Amazon charges a mandatory **$0.15/unit** (Jan–Oct) and **$0.30/unit** (Nov–Dec peak) manual processing fee when box content information is omitted or manually unpacked at inbound receiving docks. Existing software tools charge steep monthly subscriptions ($50–$150/month) and require exposing confidential catalog inventory data to third-party cloud servers.

## 2. JOB (JOB-TO-BE-DONE)
- **Core Outcome:** Provide an instant, client-side browser studio that generates scannable, Amazon-compliant 2D box content barcodes (ISO/IEC 15438 PDF417 and ISO/IEC 16022 Data Matrix) and formatted 4x6" (101.6 x 152.4 mm) thermal carton labels.
- **Workflow:**
  1. Ingest shipment catalog via standard CSV, TSV, or built-in multi-box editor.
  2. Compute carton-level unit distributions, total units, and fee savings.
  3. Deterministically encode single-SKU or multi-SKU carton payloads into scannable 2D barcodes (`AMZN,PO:<ShipmentId>,FNSKU:<FNSKU>,QTY:<Qty>`).
  4. Preview real-time 300-DPI thermal label canvas.
  5. Export 4x6" vector thermal PDF files (jsPDF) and official Amazon 2D box manifest CSV files.

## 3. MUST-NOT (CONSTRAINTS & NON-GOALS)
1. **MUST NOT transmit user input over any network:** Zero telemetry, analytics, server logs, or API relays carrying shipment IDs, FNSKUs, SKUs, product titles, quantities, unit costs, or selling prices. Backend compute cost is strictly $0.00.
2. **MUST NOT print blurry or unreadable barcodes:** Subpixel anti-aliasing and fractional module scaling are forbidden. Module width must meet Amazon specs (PDF417 module width ≥ 0.020 in / 0.508 mm, ECC Level 6; Data Matrix module size ≥ 0.040 in / 1.016 mm).
3. **MUST NOT leak confidential cost or margin data on physical carton labels:** Carton labels are affixed to shipping boxes handled by freight carriers, 3PLs, and warehouse workers. Labels must display carton packing lists (FNSKU, title, quantity) only. Unit costs and profit margins must NEVER appear on the printable label or PDF.
4. **MUST NOT require recurring monthly subscriptions:** Utility is monetized via a single $29 lifetime license.
5. **MUST NOT depend on server-side rendering or backend daemons:** 100% browser runtime execution (WebAssembly, Web Workers, HTML5 Canvas, client TypeScript).

## 4. ENGINE
- **2D Barcode Generation:** `bwip-js` (compiled Barcode Writer in Pure PostScript running client-side in JS/WASM).
- **Optical Barcode Verification:** `zxing-wasm` (WebAssembly port of ZXing C++ barcode library for independent round-trip decode verification).
- **Thermal Label Document Generation:** `jspdf` (client-side native vector PDF generation for 101.6 x 152.4 mm 4x6" thermal stock).
- **Tabular Data Ingestion & Manifest Export:** `papaparse` (browser-side streaming CSV parser and serializer).
- **Static Hosting:** Cloudflare Pages (zero backend compute).

## 5. PRICE
- **Free Tier:** Up to 5 boxes and 10 SKUs per shipment with live 4x6 thermal preview, scannable barcode generation, and sample loading.
- **Pro Tier:** $29 one-time payment for unlimited cartons per shipment, batch multi-page 4x6 thermal PDF generation, and Amazon 2D CSV manifest export.
- **Billing Integration:** Hosted merchant-of-record (Paddle / LemonSqueezy / Stripe Checkout) returning client-side license keys.

## 6. ACCEPTANCE TESTS (LOCKED INVARIANTS)
- **AT-1 (Optical Decodability Invariant):** Round-trip decode check: For any valid single-SKU or multi-SKU payload $x$, the decoded text from the rendered barcode image must be bit-exact: $D_{zxing}(G_{bwip}(x)) \equiv x$.
- **AT-2 (Amazon 2D Syntax Invariant):** Barcode payload strings must strictly conform to Amazon FBA format:
  - Single-SKU: `AMZN,PO:<ShipmentID>,FNSKU:<FNSKU>,QTY:<Qty>[,EXP:<YYMMDD>]`
  - Multi-SKU: `AMZN,PO:<ShipmentID>,FNSKU:<FNSKU1>,QTY:<Qty1>...,FNSKU:<FNSKUn>,QTY:<Qtyn>`
- **AT-3 (Air-Gap & Zero Network Egress Invariant):** No network request (`fetch`, `XMLHttpRequest`, `navigator.sendBeacon`, `WebSocket`) may be initiated during data processing, barcode generation, PDF rendering, or CSV export that contains user input or shipment data. Any outbound network egress containing user data fails the test suite.
- **AT-4 (Label Cost Privacy Invariant):** The generated 4x6" thermal label canvas and vector PDF export must never contain the strings or numeric values representing supplier costs, retail prices, or profit margins.
- **AT-5 (Deterministic 4x6 Dimension Geometry):** The generated PDF document must specify an exact page size of 101.6 x 152.4 mm (within 0.5 mm tolerance) and begin with the valid binary header `%PDF-1.`.
