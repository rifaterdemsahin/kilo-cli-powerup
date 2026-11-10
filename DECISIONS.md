# Decisions

Every non-obvious choice made while building this Short, and why.

## Source audio
| Decision | Why |
|---|---|
| Use `ZOOM0022.WAV` (27 s) | It is the latest recording. I first picked ZOOM0021 by newest date, but the H2N clock reset after a battery change, so dates are unreliable. **Latest = highest ZOOM number.** |
| ZOOM0020/0021 rejected | Silent. Whisper "transcribed" them as "Thank you." / "Thanks for watching!", which is a known hallucination on non-speech audio. |
| Clean audio before Whisper (`highpass 80 Hz` + `loudnorm`, mono 16 kHz) | The recorder level was low. Normalising gives Whisper a consistent signal. |
| Whisper `small`, local, English forced | Free, private, accurate enough for 27 s. Auto-detect guessed "Nynorsk" on noise, so the language is forced. |
| Two Whisper passes | Segment pass for the text/SRT, word-timestamp pass for animated subtitles. The word pass dropped the last word ("DeepSeek"), so `prep_remotion.py` patches it in at 25.6-26.3 s (timing from the segment pass). |
| "JEV" kept as transcribed | Probably a mis-hearing. Not guessed. Needs the user to confirm. |

## Format
| Decision | Why |
|---|---|
| 1080x1920, 30 fps, 27 s | YouTube Short; the user said "no more than 30 seconds". Length = the voiceover length. |
| Voiceover = the original recording | It is the user's own content about Kilo CLI. No TTS. |

## Visuals (fal.ai, cost-effective)
| Decision | Why |
|---|---|
| `fal-ai/flux/schnell`, 4 steps, portrait_16_9 | Cheapest good image model, about a fraction of a cent each. |
| Only 2 of 5 shots animated (`ltx-video` image-to-video) | Video generation is the expensive part. Shots 2 and 5 carry the key ideas. The rest get a free Ken Burns zoom. |
| Style string appended to every prompt | One consistent neon dark-terminal look, no text/logos (AI image text is unreliable; real text is done in Remotion). |
| All outputs cached in `build/`, skipped on re-run | Re-runs cost nothing; `--dry-run` previews jobs. |
| Models overridable via env vars | `IMAGE_MODEL`, `VIDEO_MODEL`, `AUDIO_MODEL`. |
| Music + SFX from `fal-ai/stable-audio` | One vendor, one key. SFX are 3 s clips placed at each cut; music is a 27 s bed. |

## Rendering
| Decision | Why |
|---|---|
| **Remotion** is the final renderer (`remotion/`) | Requested by the user; gives real animated subtitles and React-based composition. |
| First built an ffmpeg assembler (`scripts/assemble.py`) | It works as a no-Node fallback. This ffmpeg has no libass/freetype, so captions use Pillow PNG overlays. Remotion supersedes it for the animated look. |
| Subtitles: ~4-word phrases, each word springs in, the active word pops and glows cyan, keywords (Kilo, CLI, LSP, indexing, DeepSeek, frontier, models, critical) are violet and larger | Word-level highlight keeps attention on a short; phrases are kept short to stay readable on a phone. |
| Captions sit above the bottom 330 px | Avoids the Shorts UI (title, buttons) covering the text. |
| Music at 15% volume, SFX at 60%, voice at 100% | The voice is the content; the recording is quiet and noisy, so music is kept low. |
| Placeholder backgrounds when images are missing | Lets the composition render and be reviewed without a working fal.ai key. |
| `remotion/public/data.json` is committed, media is not | The JSON is small and needed to typecheck. Media is big and reproducible. |

## Screenshot callout
| Decision | Why |
|---|---|
| Use the user's real Kilo CLI screenshot (`assets/images/kilo-lsp.jpeg`, latest image in Downloads) from 4.8-10.0 s | Real proof beats an AI image of a terminal. It shows LSP and Code Indexing both *disabled*, which matches "I'm going to enable LSP and indexing". |
| Moving yellow arrow + pulsing box: points at LSP when "LSP" is spoken (7.2 s), glides to Code Indexing on "indexing" (9.0 s) | Syncs the visual to the narration. Targets and pixel positions live in `storyboard.json` -> `callout`, so they are editable without code changes. |
| Screenshot is dimmed-backdrop, framed in cyan, shown 700 px wide | Keeps the text readable on a phone while the animated shot stays visible behind it. |
| "JEV" is confirmed | The screenshot title reads "LSP and JEV status check", so the transcript is correct as written. |

## Secrets
| Decision | Why |
|---|---|
| Keys live in Azure Key Vault `dp-kv-deliverypilot` (`FAL-AI-KEY`) | The user's choice. `scripts/run.sh` injects `FAL_KEY` into one command's environment. |
| Nothing secret is written to disk or git | `.env*` ignored; the scripts only read `FAL_KEY` from the environment. |
| The vault key was rejected (HTTP 401, both versions) | Revoked or expired. For this build the user supplied a one-day key, passed inline as an env var for a single command. It was never stored. **Rotate the vault secret.** |
| `convex-poc-kv` not used | Forbidden for this account, and not needed. |

## Not done
| Item | Why |
|---|---|
| Remotion agent skills / MCP not installed | The command (`npx skills add remotion-dev/skills`) pulls and runs remote code; the permission system blocked it. The project works without it. Run it yourself if you want it. |
