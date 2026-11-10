#!/usr/bin/env python3
"""Assemble the Short with ffmpeg: 1080x1920 shots (Ken Burns on stills, or
animated clips), burned-in captions, voiceover + ducked music + SFX.
Output: build/short.mp4. No network, no keys."""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
B = ROOT / "build"
W, H, FPS = 1080, 1920, 30


def run(cmd):
    print(" ".join(str(c) for c in cmd[:6]), "...")
    subprocess.run([str(c) for c in cmd], check=True)


def parse_srt(path):
    import re
    def t(s):
        h, m, r = s.replace(",", ".").split(":")
        return int(h) * 3600 + int(m) * 60 + float(r)
    cues = []
    for blk in path.read_text().strip().split("\n\n"):
        lines = blk.strip().splitlines()
        a, b = lines[1].split(" --> ")
        cues.append((t(a), t(b), " ".join(lines[2:])))
    # merge a trailing fragment (<1.5 s) into the previous cue so captions don't flash
    merged = []
    for c in cues:
        if merged and c[1] - c[0] < 1.5:
            p = merged.pop()
            c = (p[0], c[1], p[2] + " " + c[2])
        merged.append(c)
    return merged


def render_caption(text, out):
    import textwrap
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 64, index=1)
    lines = textwrap.wrap(text, 24)
    y = H - 520 - len(lines) * 80
    for ln in lines:
        w = d.textlength(ln, font=font)
        d.text(((W - w) / 2, y), ln, font=font, fill="white",
               stroke_width=6, stroke_fill="black")
        y += 80
    img.save(out)


def main():
    sb = json.loads((ROOT / "storyboard.json").read_text())
    total = sb["duration"]
    voice = ROOT / sb["voiceover"]
    srt = ROOT / "assets/transcript/ZOOM0022.srt"
    if not voice.exists():
        sys.exit(f"missing {voice} (copy ZOOM0022.WAV from the SD card, see README)")

    # 1. per-shot clips
    clips = []
    for s in sb["shots"]:
        dur = s["end"] - s["start"]
        out = B / f"{s['id']}_clip.mp4"
        mp4, png = B / f"{s['id']}.mp4", B / f"{s['id']}.png"
        fit = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"
        if mp4.exists():
            run(["ffmpeg", "-y", "-loglevel", "error", "-stream_loop", "-1", "-i", mp4,
                 "-t", dur, "-vf", f"{fit},fps={FPS}", "-an", "-pix_fmt", "yuv420p", out])
        else:
            frames = int(dur * FPS)
            zoom = f"zoompan=z='1+0.12*on/{frames}':d={frames}:s={W}x{H}:fps={FPS}"
            run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", png, "-t", dur,
                 "-vf", f"scale=2160:-2,{zoom}", "-an", "-pix_fmt", "yuv420p", out])
        clips.append(out)

    lst = B / "clips.txt"
    lst.write_text("".join(f"file '{c.name}'\n" for c in clips))
    video = B / "video.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-i", lst, "-c", "copy", video])

    # 2. audio mix: voice (cleaned) + music ducked by voice + sfx at cut times
    inputs = ["-i", voice, "-i", B / "music.wav"]
    sfx = [(s["sfx"]["at"], B / f"{s['id']}_sfx.wav") for s in sb["shots"]
           if s.get("sfx") and (B / f"{s['id']}_sfx.wav").exists()]
    for _, f in sfx:
        inputs += ["-i", f]
    fc = ["[0:a]highpass=f=80,loudnorm=I=-14,aformat=sample_rates=44100:channel_layouts=stereo,asplit=2[v][vsc]",
          "[1:a]volume=0.5,aformat=sample_rates=44100:channel_layouts=stereo[m]",
          "[m][vsc]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=400[md]"]
    mix = ["[v]", "[md]"]
    for i, (at, _) in enumerate(sfx):
        ms = int(at * 1000)
        fc.append(f"[{i+2}:a]volume=0.6,aformat=sample_rates=44100:channel_layouts=stereo,"
                  f"adelay={ms}|{ms}[x{i}]")
        mix.append(f"[x{i}]")
    fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,alimiter=limit=0.95[a]")
    audio = B / "audio.m4a"
    run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(fc),
         "-map", "[a]", "-t", total, "-c:a", "aac", "-b:a", "192k", audio])

    # 3. captions + mux
    # Captions are Pillow-rendered PNG overlays: works on ffmpeg builds without libass/freetype.
    cues = parse_srt(srt)
    cap_in, chain, prev = [], [], "[0:v]"
    for i, (a, b, text) in enumerate(cues):
        png = B / f"cap{i}.png"
        render_caption(text, png)
        cap_in += ["-i", png]
        out = f"[c{i}]"
        chain.append(f"{prev}[{i+2}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'{out}")
        prev = out
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", audio, *cap_in,
         "-filter_complex", ";".join(chain), "-map", prev, "-map", "1:a",
         "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy",
         "-t", total, "-movflags", "+faststart", B / "short.mp4"])
    print("done: build/short.mp4")


if __name__ == "__main__":
    main()
