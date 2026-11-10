#!/usr/bin/env python3
"""Copy assets into remotion/public and write public/data.json (word timings, shots,
which generated assets exist). Run before `npm run studio|render` in remotion/."""
import json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
B, PUB = ROOT / "build", ROOT / "remotion/public"
PUB.mkdir(parents=True, exist_ok=True)

sb = json.loads((ROOT / "storyboard.json").read_text())
words = [{"text": w["word"].strip(), "start": round(w["start"], 2), "end": round(w["end"], 2)}
         for s in json.loads((B / "whisper_words/ZOOM0022.16k.json").read_text())["segments"]
         for w in s["words"]]
# Whisper's word-timestamp pass dropped the final word; the segment pass heard it at 25.4-26.2s.
if words[-1]["text"] == "using":
    words.append({"text": "DeepSeek", "start": 25.6, "end": 26.3})

def put(src: Path, name: str):
    if src.exists():
        shutil.copy(src, PUB / name)
        return name

shots = []
for s in sb["shots"]:
    shots.append({"id": s["id"], "start": s["start"], "end": s["end"],
                  "label": s["caption_hint"],
                  "image": put(B / f"{s['id']}.png", f"{s['id']}.png"),
                  "video": put(B / f"{s['id']}.mp4", f"{s['id']}.mp4"),
                  "sfx": put(B / f"{s['id']}_sfx.wav", f"{s['id']}_sfx.wav"),
                  "sfxAt": (s.get("sfx") or {}).get("at")})

voice = put(ROOT / sb["voiceover"], "voice.wav")
data = {"duration": sb["duration"], "voice": voice, "music": put(B / "music.wav", "music.wav"),
        "words": words, "shots": shots}
(PUB / "data.json").write_text(json.dumps(data, indent=2))
print(f"{len(words)} words, {sum(1 for s in shots if s['image'])}/{len(shots)} images, "
      f"music={'yes' if data['music'] else 'no'}")
