#!/usr/bin/env python3
"""Generate visuals, optional animations, music and SFX with fal.ai.

Reads storyboard.json, writes to build/. Needs FAL_KEY in the environment
(use scripts/run.sh, which pulls it from Azure Key Vault). Stdlib only.
Existing outputs are skipped so re-runs cost nothing.
"""
import argparse, base64, json, os, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"

IMAGE_MODEL = os.environ.get("IMAGE_MODEL", "fal-ai/flux/schnell")   # ~cheapest good image model
VIDEO_MODEL = os.environ.get("VIDEO_MODEL", "fal-ai/ltx-video/image-to-video")
AUDIO_MODEL = os.environ.get("AUDIO_MODEL", "fal-ai/stable-audio")   # music + sfx


def call(model: str, payload: dict) -> dict:
    key = os.environ.get("FAL_KEY")
    if not key:
        sys.exit("FAL_KEY not set. Run via scripts/run.sh")
    req = urllib.request.Request(
        f"https://fal.run/{model}",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Key {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.load(r)


def download(url: str, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, dest)
    print(f"  saved {dest.relative_to(ROOT)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="list what would be generated")
    ap.add_argument("--no-animate", action="store_true", help="skip image-to-video")
    args = ap.parse_args()

    sb = json.loads((ROOT / "storyboard.json").read_text())
    jobs = []
    for s in sb["shots"]:
        jobs.append(("image", s["id"], BUILD / f"{s['id']}.png"))
        if s.get("animate") and not args.no_animate:
            jobs.append(("video", s["id"], BUILD / f"{s['id']}.mp4"))
        if s.get("sfx"):
            jobs.append(("sfx", s["id"], BUILD / f"{s['id']}_sfx.wav"))
    jobs.append(("music", "music", BUILD / "music.wav"))

    shots = {s["id"]: s for s in sb["shots"]}
    for kind, sid, out in jobs:
        todo = not out.exists()
        print(f"[{kind}] {sid} -> {out.name} {'(skip, exists)' if not todo else ''}")
        if args.dry_run or not todo:
            continue
        if kind == "image":
            prompt = f"{shots[sid]['image']}, {sb['style']}"
            res = call(IMAGE_MODEL, {"prompt": prompt, "image_size": "portrait_16_9",
                                     "num_inference_steps": 4, "num_images": 1})
            download(res["images"][0]["url"], out)
        elif kind == "video":
            img = (BUILD / f"{sid}.png").read_bytes()
            uri = "data:image/png;base64," + base64.b64encode(img).decode()
            res = call(VIDEO_MODEL, {"prompt": shots[sid]["image"] + ", subtle camera motion",
                                     "image_url": uri})
            download(res["video"]["url"], out)
        elif kind == "sfx":
            res = call(AUDIO_MODEL, {"prompt": shots[sid]["sfx"]["prompt"], "seconds_total": 3})
            download(res["audio_file"]["url"], out)
        elif kind == "music":
            res = call(AUDIO_MODEL, {"prompt": sb["music"]["prompt"],
                                     "seconds_total": sb["music"]["seconds"]})
            download(res["audio_file"]["url"], out)


if __name__ == "__main__":
    main()
