# {{TITLE}}

YouTube Short (9:16, under 30 s) built from a voice recording: local Whisper transcript, cheap fal.ai visuals,
music + SFX, Remotion render with animated subtitles. Created from the kilo-cli-powerup template.

## Flow

```
recording -> scripts/transcribe.sh -> assets/transcript/*.{txt,srt,words.json}
storyboard.json (edit this) -> scripts/run.sh python3 scripts/generate.py -> build/*.png|mp4|wav
scripts/prep_remotion.py -> remotion/public/data.json -> (cd remotion && npm run render) -> build/short.mp4
```

## Steps (see docs/PLAYBOOK.md for the why behind each)

1. Put the recording in `assets/audio/`; run `scripts/transcribe.sh assets/audio/<file> small`.
2. Read the transcript. Silent audio gives "Thank you." hallucinations. Fix the words you can hear are wrong.
3. Edit `storyboard.json`: shots, hook, callouts (your real screenshots in `assets/images/`), banner, formula.
4. `scripts/run.sh python3 scripts/generate.py --dry-run`, then without `--dry-run` (keys come from your vault).
5. Look at every generated image. Regenerate any with garbled text (edit prompt, delete the file, re-run).
6. `python3 scripts/prep_remotion.py && cd remotion && npm install && npm run studio` to preview, `npm run render`.
7. Fill in `SANITY_CHECK.md`, fix what fails, then publish `build/short.mp4`.
8. Log decisions in `DECISIONS.md` as you go.

## Secrets

Never commit keys. `scripts/run.sh` reads `FAL_KEY` from Azure Key Vault (`KEYVAULT_NAME`, `FAL_SECRET_NAME`) per command.
