# kilo-cli-powerup

Pipeline that turns a voice recording about **Kilo CLI** into a YouTube Short (9:16, under 30 s):
local Whisper transcription, cheap fal.ai visuals/animation, music and sound effects, ffmpeg assembly.

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

`ffmpeg`, `whisper` (openai-whisper), `python3`, `az` (Azure CLI, logged in). Captions are rendered with Pillow (`pip install pillow`) and overlaid, so ffmpeg does not need libass/freetype (Homebrew's build here lacks both).

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
python3 scripts/assemble.py        # -> build/short.mp4

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
scripts/assemble.py    ffmpeg: clips + captions + audio mix
assets/transcript/     transcript + captions
```
