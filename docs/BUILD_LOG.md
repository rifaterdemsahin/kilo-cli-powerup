# Build log: how this Short was made

Chronological record of everything done in this project, including dead ends. Decisions and reasons are in
`../DECISIONS.md`; the reusable recipe is `PLAYBOOK.md`. No secrets appear here.

| # | Step | Result / lesson |
|---|------|-----------------|
| 1 | Looked for "the last file" on the SD card `/Volumes/H2N_SD` (Zoom H2N). Sorted by modified date -> `ZOOM0021.WAV`. | Wrong: the recorder clock had reset after a battery change. The real latest was `ZOOM0022.WAV`. **Latest = highest file number.** |
| 2 | Transcribed ZOOM0021 with local Whisper (`base`, `small`, `medium`; normalised and boosted). | Only "Thank you." / "Thanks for watching!": hallucinations on silence. Auto language detect said "Nynorsk". Stopped and asked instead of inventing a Short. |
| 3 | Tried ZOOM0020 and ZOOM0019 (8 min). Stopped the long job when the user pointed at ZOOM0022. | ZOOM0020 silent too. |
| 4 | Transcribed `ZOOM0022.WAV` (27 s): real speech about Kilo CLI, LSP, indexing, JEV, DeepSeek. | Transcript + SRT saved in `assets/transcript/`. |
| 5 | Found the API keys in Azure Key Vault `dp-kv-deliverypilot` (`FAL-AI-KEY`); `convex-poc-kv` forbidden. Saved as a memory note. | `scripts/run.sh` injects `FAL_KEY` per command; nothing is written to disk. |
| 6 | Wrote the pipeline: `storyboard.json`, `generate.py` (fal.ai), `assemble.py` (ffmpeg), `transcribe.sh`, README. Committed and pushed. | Dry run lists 13 jobs. |
| 7 | fal.ai returned 401 for both versions of the vault key. | Key revoked/expired. Built the Remotion composition with procedural placeholder backgrounds meanwhile. |
| 8 | ffmpeg here has no libass/freetype (no `subtitles`/`drawtext`). | Captions as Pillow PNG overlays in the ffmpeg fallback; Remotion does the real animated captions. |
| 9 | Set up Remotion 4 (`remotion/`): word-level subtitles (phrases of ~4 words, active word pops cyan, keywords violet), chips, progress bar, voice + music + SFX. `npx skills add remotion-dev/skills` was blocked by the permission system (remote code); not needed. | First stills looked black at frame 150: it was exactly the cut with a fade-in, not a bug. |
| 10 | User supplied a one-day fal.ai key; used inline as an env var for single commands (never stored). Generated 5 images, 2 animated clips, 5 SFX, music. | Rendered the real Short. |
| 11 | Added the user's real Kilo status screenshot with an animated arrow (LSP, then Code Indexing). | Real proof beats an AI terminal. |
| 12 | Added `indexing.jpg` callout (arrow on the DB icon) and a JEV pencil sketch. A fal.ai attempt at the sketch produced garbled text and lost the blue/red split -> redrawn in Remotion SVG with draw-on animation. | Diagrams with meaning belong in code. |
| 13 | Added the hook question (start) and the formula (end); extended 27 s -> 29.5 s; froze the last frame of the 5 s clip under the 6.5 s shot. | Stays under 30 s. |
| 14 | Sanity check (`SANITY_CHECK.md`): found raw noisy voice, constant-level music, hot SFX, garbled text in shot s4, arrow covering the `$0.00` proof. Fixed all; moved the real UI earlier; hedged "frontier-level" -> "frontier-like". | Final mix -15.3 LUFS, TP -1.3 dBFS. |
| 15 | Added the "why go through all this hassle -> 10x less cost than a frontier model setup" banner at 0:21 (user's claim, flagged unverified). | |
| 16 | Made the engine reusable: typed `remotion/src/data.ts`, no hard-coded filenames, `word_patches`, optional scenes; `template/` + `scripts/new_project.sh`; `docs/PLAYBOOK.md`. | A new Short = scaffold, record, edit `storyboard.json`. |
| 17 | Added a thumbnail composition (`Thumb.tsx`, `npm run thumb` -> `assets/thumbnail.jpg`) and `index.html`, a publish kit with editable title options, description, hashtags, tags, pinned comment, copy buttons and the thumbnail. First thumbnail clipped "DEEPSEEK" at the right edge -> shrunk the type. Tested in Chrome: real mouse click shows "Copied" (synthetic `.click()` and `clipboard.readText()` are not valid tests: the latter hangs on a permission prompt). Port 8765 was already used by another local app ("Downloads -> Vault"), so I served on 8791 and confirmed the page title before testing. | The extension can't open `file://`; serve on a free port. Always check the page you are testing is yours. |
| 18 | Longer intro: +2 s before the first word, curiosity teaser on frame 0 + the question, and cut the filler "As you see here though," via `voice_trim` so the Short stays at 29.6 s. Added `hook.teaser`, `voice_trim` to `storyboard.json`, prep shifts/drops caption words, `Short.tsx` plays the trimmed voice inside a `Sequence`. | Doing it naively (+2 s) would have been 31.5 s, over the 30 s limit. |

## Commands that reproduce the Short

```bash
scripts/transcribe.sh assets/audio/ZOOM0022.WAV small          # needs the WAV copied from the SD card
scripts/run.sh python3 scripts/generate.py                     # fal.ai; key from Azure Key Vault
python3 scripts/prep_remotion.py
cd remotion && npm install && npm run render                   # -> ../build/short.mp4
```

## Files in this repo

`storyboard.json` (source of truth) · `scripts/` (run, transcribe, generate, prep_remotion, assemble, new_project) ·
`remotion/` (project) · `assets/transcript`, `assets/images` · `template/` · `docs/` · `README.md` · `DECISIONS.md` · `SANITY_CHECK.md`.
