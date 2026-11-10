#!/usr/bin/env python3
"""Copy assets into remotion/public and write public/data.json (word timings, shots,
which generated assets exist). Run before `npm run studio|render` in remotion/."""
import json, shutil, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
B, PUB = ROOT / "build", ROOT / "remotion/public"
PUB.mkdir(parents=True, exist_ok=True)

sb = json.loads((ROOT / "storyboard.json").read_text())
words = [{"text": w["word"].strip(), "start": round(w["start"], 2), "end": round(w["end"], 2)}
         for s in json.loads((ROOT / sb["words_json"]).read_text())["segments"]
         for w in s["words"]]
for patch in sb.get("word_patches", []):       # re-insert words Whisper's word pass dropped
    if words and words[-1]["text"] == patch["after"]:
        words.append({"text": patch["text"], "start": patch["start"], "end": patch["end"]})

trim = sb.get("voice_trim")
if trim:   # captions follow the trimmed voice: drop skipped words, shift the rest to the timeline
    off = trim["at"] - trim["from"]
    words = [{**w, "start": round(w["start"] + off, 2), "end": round(w["end"] + off, 2)}
             for w in words if w["end"] > trim["from"]]

def put(src: Path, name: str):
    if src.exists():
        shutil.copy(src, PUB / name)
        return name

def clip_seconds(path: Path):
    if not path.exists():
        return None
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True).stdout.strip()
    return float(out)

shots = []
for s in sb["shots"]:
    shots.append({"id": s["id"], "start": s["start"], "end": s["end"],
                  "label": s["caption_hint"],
                  "image": put(B / f"{s['id']}.png", f"{s['id']}.png"),
                  "video": put(B / f"{s['id']}.mp4", f"{s['id']}.mp4"),
                  "videoSeconds": clip_seconds(B / f"{s['id']}.mp4"),
                  "sfx": put(B / f"{s['id']}_sfx.wav", f"{s['id']}_sfx.wav"),
                  "sfxAt": (s.get("sfx") or {}).get("at")})

callouts = []
for c in sb.get("callouts", []):
    c = dict(c); c["image"] = put(ROOT / c["image"], f"callout_{c['id']}" + Path(c["image"]).suffix); callouts.append(c)
# Clean the noisy room recording: remove rumble, light denoise, normalise to ~-14 LUFS so music/SFX sit under it.
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(ROOT / sb["voiceover"]),
                "-af", "highpass=f=90,afftdn=nf=-28,loudnorm=I=-14:TP=-3:LRA=7",
                "-ar", "48000", str(PUB / "voice.wav")], check=True)
thumb = None
if sb.get("thumbnail"):
    thumb = {k: v for k, v in sb["thumbnail"].items() if k != "shot"}
    thumb["image"] = f"{sb['thumbnail']['shot']}.png" if (PUB / f"{sb['thumbnail']['shot']}.png").exists() else None

voice = "voice.wav"
data = {"duration": sb["duration"], "voice": voice, "music": put(B / "music.wav", "music.wav"),
        "callouts": callouts, "hook": sb.get("hook"), "endCard": sb.get("endCard"), "voiceTrim": trim, "thumbnail": thumb, "banner": sb.get("banner"), "formula": sb.get("formula"), "jev": sb.get("jev"), "words": words, "shots": shots}
(PUB / "data.json").write_text(json.dumps(data, indent=2))
print(f"{len(words)} words, {sum(1 for s in shots if s['image'])}/{len(shots)} images, "
      f"music={'yes' if data['music'] else 'no'}")
