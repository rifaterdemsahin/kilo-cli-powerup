# Playbook: voice recording -> YouTube Short

The reusable recipe, with the mistakes this project already paid for. Start a new project with
`scripts/new_project.sh <dir> "<title>"`.

## 1. Source audio
- Latest file on a recorder = highest file number, not newest date (clocks reset on battery change).
- Whisper hallucinates "Thank you." / "Thanks for watching!" on silence. Check level (`volumedetect`) and read the transcript.
- Clean before transcribing: `highpass=f=80,loudnorm`, mono 16 kHz. Force the language; auto-detect guesses wrong on noise.
- Get word timestamps for animated captions. The word pass can drop the last word -> `word_patches`.

## 2. Story
- Hook = a question the Short answers, on screen from frame 0, <= ~12 words.
- Close the loop with a payoff (formula / result) and a safe CTA.
- Keep total length under the limit; extend only for the payoff (voice ended 26.3 s, video 29.5 s).
- Use the author's real screenshots as proof wherever possible; use AI imagery only as mood.

## 3. Visuals (cheap)
- Images: fal `flux/schnell`, 4 steps (cents). Animate only 1-2 hero shots (image-to-video); Ken Burns for the rest;
  freeze the last frame if a clip is shorter than its shot.
- Image models invent garbled text. Say "no text, letters, numbers, UI" and look at every image at full size.
  Regenerate bad ones (delete the file, re-run; outputs are cached).
- Diagrams with meaning (flows, formulas): draw them in Remotion (SVG), don't ask an image model.

## 4. Audio
- Voice: highpass + light denoise + loudnorm -14 LUFS, TP -3. Music ducks under speech (volume function from word times).
  SFX at about 30%. Fade music out. Measure the final mix (`ffmpeg -af ebur128=peak=true`).

## 5. Render (Remotion)
- `storyboard.json` is the single source of truth; `prep_remotion.py` turns it into `remotion/public/data.json`; the
  components read it through the typed `src/data.ts`.
- Scenes available: shot backgrounds + chips, hook card, screenshot callouts with moving arrow, banner (question +
  big claim), formula, animated word-by-word subtitles, optional custom SVG scene (`JevSketch.tsx` as the pattern).
- This Mac's ffmpeg has no libass/freetype: don't rely on `subtitles`/`drawtext` (the ffmpeg fallback uses Pillow PNGs).
- Preview with `npm run studio`; check stills at key frames: `npx remotion still src/index.ts Short out.png --frame=N`.

## 6. Secrets and tooling
- Keys live in Azure Key Vault (`dp-kv-deliverypilot`); `scripts/run.sh` injects `FAL_KEY` for one command.
  A 401 means the key is dead (check both secret versions); supply a temporary key via env var, never a file.
- Remote installers like `npx skills add ...` may be blocked by the permission system; the project doesn't need them.

## 7. Before publishing
Fill in `SANITY_CHECK.md` (hook, delivery, value). Mark claims you can't prove. Say what you did not verify.
