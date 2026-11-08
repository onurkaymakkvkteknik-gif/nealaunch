import os
import sys
import time
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from playwright.sync_api import sync_playwright

DIST_DIR = "/Users/znatan/agy-factory/ventures/001-fba-2d-studio/dist"
SCREENSHOT_PATH = "/Users/znatan/agy-toolkit/artifacts/live_dom_canvas_screenshot.png"
os.makedirs("/Users/znatan/agy-toolkit/artifacts", exist_ok=True)

class SilentHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(("127.0.0.1", 8991), SilentHandler)
    server.serve_forever()

srv = threading.Thread(target=run_server, daemon=True)
srv.start()
time.sleep(1)

print("[LIVE-DOM GATE] Local server listening on http://127.0.0.1:8991")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://127.0.0.1:8991/tools/amazon-us-fba-2d-box-barcode-electronics-margin-stamper/")
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Click Load Sample Data to guarantee Box 1 multi-SKU is active
    page.click("#btn-load-sample")
    time.sleep(1.5)

    # Locate the live rendered canvas in browser DOM
    canvas_loc = page.locator("#barcode-2d-canvas")
    canvas_loc.wait_for(state="visible", timeout=5000)

    # Take physical screenshot of the DOM element
    png_bytes = canvas_loc.screenshot()
    with open(SCREENSHOT_PATH, "wb") as f:
        f.write(png_bytes)

    print(f"[LIVE-DOM GATE] Captured live browser DOM canvas screenshot: {len(png_bytes)} bytes -> {SCREENSHOT_PATH}")
    browser.close()

# 2. Decode via zxing-wasm in Node
import subprocess
decode_cmd = [
    "node",
    "-e",
    f"""
    import fs from 'fs';
    import {{ readBarcodes }} from 'zxing-wasm/full';
    async function test() {{
        const buf = fs.readFileSync('{SCREENSHOT_PATH}');
        const results = await readBarcodes(buf, {{ formats: ['PDF417'], tryHarder: true }});
        if (!results || results.length === 0) {{
            console.error('LIVE DOM DECODE FAILED: No barcode detected in DOM screenshot');
            process.exit(1);
        }}
        const text = results[0].text;
        const expected = 'AMZN,PO:FBA9916948U,FNSKU:X005YCP1,QTY:17,FNSKU:X005YDCA,QTY:24,FNSKU:X005YDZJ,QTY:31';
        console.log('[LIVE-DOM ZXING-WASM DECODE] Detected format:', results[0].format);
        console.log('[LIVE-DOM ZXING-WASM DECODE] Decoded text   :', text);
        if (text === expected) {{
            console.log('✔ LIVE-DOM INVARIANT CONFIRMED: D_zxing(DOM_canvas_screenshot) === AMZN,PO: (100% BIT-EXACT)');
            process.exit(0);
        }} else {{
            console.error('MISMATCH: ' + text + ' != ' + expected);
            process.exit(1);
        }}
    }}
    test();
    """
]

res = subprocess.run(decode_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
print(res.stdout)
if res.returncode != 0:
    print(res.stderr)
    sys.exit(res.returncode)
