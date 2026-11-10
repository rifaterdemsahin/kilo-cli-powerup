# kilo-cli-powerup

Pipeline that turns a voice recording about **Kilo CLI** into a YouTube Short (9:16, under 30 s):
local Whisper transcription, cheap fal.ai visuals/animation/music/SFX, Remotion rendering with animated subtitles.
See [DECISIONS.md](DECISIONS.md) for every choice and why.

## Flow

```
SD card ZOOM0022.WAV
   |  scripts/transcribe.sh        Whisper (local): text + SRT + word timings
   v
assets/transcript/*.txt|srt   +   storyboard.json (shots, prompts, SFX cues, music)
   |  scripts/run.sh python3 scripts/generate.py     fal.ai, key from Azure Key Vault
   v
build/  s1..s5.png, s2.mp4, s5.mp4, sN_sfx.wav, music.wav
   |  scripts/prep_remotion.py     copy assets + write remotion/public/data.json
   v
remotion/  (npm run studio | npm run render)   animated word-by-word subtitles
   v
build/short.mp4   (1080x1920, 27 s)
```

1. **Pick the recording**: latest = highest `ZOOM` number (not newest date; the H2N clock resets on battery change).
2. **Transcribe** locally with Whisper. Silent files produce "Thank you." hallucinations.
3. **Storyboard**: `storyboard.json` drives everything: shot timings, image prompts, which shots animate, SFX, music.
4. **Generate** with fal.ai (cheap model, 2 animated shots, rest Ken Burns). Cached, so re-runs are free.
5. **Callouts** (`callouts` in `storyboard.json`): your screenshots (`assets/images/`) with an animated arrow: the status screen -> LSP (4.8-8.8 s), `indexing.jpg` -> the indexing icon (8.8-10.8 s). A pencil-sketch **JEV** diagram, drawn in Remotion (`JevSketch.tsx`), plays at 12.4-17.9 s.
6. **Render** with Remotion. Subtitles are word-level: phrases spring in, the active word pops cyan, keywords are violet.
7. **Review** in `npm run studio`, then publish `build/short.mp4`.

Quick run:

```bash
scripts/transcribe.sh assets/audio/ZOOM0022.WAV small
scripts/run.sh python3 scripts/generate.py
python3 scripts/prep_remotion.py
cd remotion && npm install && npm run render     # or: npm run studio
```

## The Short

| Time | Voiceover (ZOOM0022.WAV, 27 s) | Visual |
|------|-------------------------------|--------|
| 0-10 s | "I'm using Kilo CLI and I'm going to enable LSP and indexing." | Terminal, then code graph being indexed |
| 10-18 s | "That is the critical part... I also use JEV to do the task." | Key piece slotting in, then workflow board |
| 18-27 s | "...make Kilo CLI work with frontier models by using DeepSeek." | Circuit whale diving through data |

Transcript: `assets/transcript/ZOOM0022.txt` / `.srt`. The shot list, prompts, SFX cues and music prompt live in `storyboard.json`. Edit that file to change the Short.

## Cost control

- Images: `fal-ai/flux/schnell` (4 steps), a fraction of a cent each.
- Animation: only shots marked `"animate": true` are animated. The rest get a free ffmpeg Ken Burns zoom. Use `--no-animate` to skip animation entirely.
- Music and SFX: `fal-ai/stable-audio` (short clips).
- Outputs are cached in `build/`, so re-runs only pay for missing files. `--dry-run` lists the jobs first.
- Models are overridable: `IMAGE_MODEL`, `VIDEO_MODEL`, `AUDIO_MODEL` env vars.

## Requirements

`node`/`npm` (Remotion), `ffmpeg`, `whisper` (openai-whisper), `python3`, `az` (Azure CLI, logged in). Captions are rendered with Pillow (`pip install pillow`) and overlaid, so ffmpeg does not need libass/freetype (Homebrew's build here lacks both).

## Secrets

No keys are stored in this repo. The fal.ai key lives in Azure Key Vault (`dp-kv-deliverypilot`, secret `FAL-AI-KEY`).
`scripts/run.sh` fetches it into the `FAL_KEY` environment variable for one command and never writes it to disk.
Override with `KEYVAULT_NAME` / `FAL_SECRET_NAME`. `.env` files are git-ignored.

## Usage

```bash
# 0. Copy the recording (latest = highest ZOOM number, NOT newest date: the H2N clock resets on battery change)
mkdir -p assets/audio && cp /Volumes/H2N_SD/STEREO/FOLDER01/ZOOM0022.WAV assets/audio/

# 1. Transcribe (already done; re-run for another file)
scripts/transcribe.sh assets/audio/ZOOM0022.WAV small

# 2. Generate visuals, animation, music, SFX (pulls key from Key Vault)
scripts/run.sh python3 scripts/generate.py --dry-run
scripts/run.sh python3 scripts/generate.py

# 3. Assemble
python3 scripts/prep_remotion.py && (cd remotion && npm install && npm run render)   # -> build/short.mp4
# fallback without Node: python3 scripts/assemble.py

open -a "Google Chrome" build/short.mp4
```

## Notes

- Whisper hallucinates "Thank you." / "Thanks for watching!" on silent audio. `ZOOM0020` and `ZOOM0021` are silent for this reason.
- "JEV" in the transcript is probably a mis-hearing; check and correct `assets/transcript/ZOOM0022.srt` before assembling.
- Source recordings and generated media are git-ignored (large, reproducible).

## Layout

```
storyboard.json        shots, prompts, SFX cues, music
scripts/run.sh         inject FAL_KEY from Azure Key Vault
scripts/transcribe.sh  clean audio + Whisper
scripts/generate.py    fal.ai images / video / music / sfx
scripts/prep_remotion.py  assets + word timings -> remotion/public/data.json
scripts/assemble.py    ffmpeg-only fallback renderer
remotion/              Remotion project (Short.tsx = scenes + animated subtitles)
DECISIONS.md           all decisions and rationale
assets/transcript/     transcript + captions
```
