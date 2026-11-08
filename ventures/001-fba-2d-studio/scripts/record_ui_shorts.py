import asyncio
import os
import sys
import time
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from playwright.sync_api import sync_playwright

DIST_DIR = "/Users/znatan/agy-factory/ventures/001-fba-2d-studio/dist"
ARTIFACT_DIR = "/Users/znatan/agy-toolkit/artifacts"
os.makedirs(ARTIFACT_DIR, exist_ok=True)
os.makedirs("/tmp/playwright_recordings", exist_ok=True)

FFMPEG = "/Users/znatan/.local/bin/ffmpeg"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(("127.0.0.1", 8989), Handler)
    server.serve_forever()

# Start background static server
srv_thread = threading.Thread(target=run_server, daemon=True)
srv_thread.start()
time.sleep(1)

print("[STAGE 3] Local preview server live at http://127.0.0.1:8989")

# 1. Generate Voiceover via edge-tts
VOICE_TEXT = "Here is how to waive Amazon's 15 cent per unit FBA box content fee and print multi-SKU 4x6 2D thermal labels in 10 seconds. Drop your shipment CSV or click sample data. The studio instantly groups SKUs by carton, calculates your fee savings, and encodes the compliant AMZN,PO PDF417 matrix. Click Box 1 to preview your 300-DPI thermal label, and click Download to batch export."

import edge_tts

async def gen_tts():
    comm = edge_tts.Communicate(VOICE_TEXT, "en-US-ChristopherNeural", rate="+20%")
    sub_maker = edge_tts.SubMaker()
    with open("/tmp/fba_voiceover.mp3", "wb") as audio_file:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                sub_maker.feed(chunk)
    with open("/tmp/fba_subtitles.srt", "w", encoding="utf-8") as srt_file:
        srt_file.write(sub_maker.get_srt())

asyncio.run(gen_tts())
print("[STAGE 3] Voiceover & Subtitles generated via edge-tts.")

# 2. Record UI with Playwright
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir="/tmp/playwright_recordings",
        record_video_size={"width": 1920, "height": 1080}
    )
    page = context.new_page()
    page.goto("http://127.0.0.1:8989/tools/amazon-us-fba-2d-box-barcode-electronics-margin-stamper/")
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    # Click Load Sample Data
    print("[STAGE 3] Triggering Load Sample Data...")
    page.click("#btn-load-sample")
    time.sleep(2)

    # Highlight Fee Savings
    page.evaluate("""() => {
        const el = document.getElementById('metric-savings');
        if (el) {
            el.style.boxShadow = '0 0 15px #10b981';
            el.style.padding = '4px 8px';
            el.style.borderRadius = '4px';
            el.style.backgroundColor = '#064e3b';
        }
    }""")
    time.sleep(3)

    # Click Box 1 in table
    print("[STAGE 3] Selecting Box 1 row...")
    page.click("#table-body tr")
    time.sleep(3)

    # Highlight 4x6 Thermal Label & PDF417 Canvas
    page.evaluate("""() => {
        const card = document.getElementById('thermal-label-card');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.transform = 'scale(1.05)';
            card.style.transition = 'transform 0.5s ease';
        }
    }""")
    time.sleep(4)

    # Trigger Download PDF
    print("[STAGE 3] Triggering Batch Thermal PDF Download...")
    page.click("#btn-download-pdf")
    time.sleep(4)

    # Finish total recorded time to match 25s voiceover
    time.sleep(7.5)

    video_path = page.video.path()
    context.close()
    browser.close()
    print(f"[STAGE 3] Raw Playwright recording saved: {video_path}")

# 3. Merge Audio + Video + Subtitles via FFmpeg
OUT_MP4 = os.path.join(ARTIFACT_DIR, "fba_2d_demo_short.mp4")

# FFmpeg command: scale/format video, add audio, burn in subtitles if supported, encode h264/aac
cmd = [
    FFMPEG,
    "-y",
    "-i", video_path,
    "-i", "/tmp/fba_voiceover.mp3",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    OUT_MP4
]

res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
if res.returncode != 0:
    print("FFmpeg error:", res.stderr.decode("utf-8")[-500:])
    sys.exit(1)

print(f"[STAGE 3] Final Production Video Rendered: {OUT_MP4}")
size_bytes = os.path.getsize(OUT_MP4)
print(f"[STAGE 3] File size: {size_bytes / (1024*1024):.2f} MB ({size_bytes} bytes)")

# Probe video duration & resolution
probe_cmd = [FFMPEG, "-i", OUT_MP4]
probe_res = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
lines = [l for l in probe_res.stderr.decode("utf-8").split("\n") if "Duration:" in l or "Video:" in l]
for l in lines:
    print(f"[STAGE 3 PROBE] {l.strip()}")
