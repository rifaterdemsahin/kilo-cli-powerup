# Sanity check: Kilo CLI + DeepSeek Short

Reviewed against the final render (`build/short.mp4`, 29.6 s, 1080x1920). Method: stills of every scene, ffmpeg
loudness measurements, and reading the transcript and storyboard. **Not done: I have not watched or listened to the
whole video in real time.** Please do one playback pass on a phone before publishing.

## Verdict

| Area | Verdict | One line |
|---|---|---|
| Hook | **Good, one wording issue open; intro lengthened** | Question is on screen from frame 0; says "frontier CLI" while the answer is about frontier *models*. |
| Delivery | **Fixed, one item needs you** | Audio and visuals had real flaws (now fixed, including the filler opener); one caption word can only be fixed by you. |
| Customer value | **Partial** | Strong proof and a clear formula, but two claims are unproven and the viewer gets ingredients, not steps. |

## Findings

| # | Area | Finding | Severity | Status | Evidence |
|---|------|---------|----------|--------|----------|
| H1 | Hook | Question is visible from 0.0 s, typewriter reveal, key words coloured, gone by 3.6 s. | - | Pass | stills at 1.5 s and 3.3 s |
| H2 | Hook | Hook says "as good as a **frontier CLI**", but the narration and formula are about frontier **models**. Mixed nouns weaken the promise. Suggested: "How can you make DeepSeek work as good as a frontier model in Kilo CLI?" (longer) or keep as is. | Low | **Open (your call)**, kept your wording | `storyboard.json` -> hook |
| H3 | Hook | Real proof used to appear only at 4.8 s, after the hook; the AI neon image stood in for "as you see here". Callout now starts at 3.7 s, right when the voice says "Kilo CLI". | Medium | **Fixed** | callout start 4.8 -> 3.7 |
| H4 | Hook | The first words were "As you see here though, ..." (filler that referred to a screen not yet shown). Now trimmed: the voice starts at "I'm using Kilo CLI" (`voice_trim` in `storyboard.json`; captions follow). | Medium | **Fixed** | transcript 1.2-3.0 s dropped |
| H6 | Hook | Intro before the first spoken word lengthened from 1.2 s to **3.2 s** (net +0.1 s overall, because the filler opener was cut). Frame 0 now carries a curiosity trigger ("5 ingredients. 1 cheap model.": true, the formula has 5 parts), then the question types out (0.12 s/word) and holds until 3.8 s. Open loop is closed by the formula. "Cheap" leans on the cost claim in V3. | Medium | **Added** | stills at 0.4 s and 3.3 s; first 3.1 s has no voice (music + SFX only, max -8.3 dB) |
| H5 | Hook | Payoff closes the loop: hook asks, formula answers at the end ("Save this formula" CTA). | - | Pass | formula still |
| D1 | Delivery | Voiceover was played raw (noisy room recording) in the Remotion version. Now: highpass 90 Hz, denoise, loudnorm -14 LUFS / TP -3. | High | **Fixed** | `prep_remotion.py` |
| D2 | Delivery | Music sat at a constant 15% under the voice. Now ducks to 6% while words are spoken, swells to 20% in gaps, fades out over the last 1.5 s. | Medium | **Fixed** | `Short.tsx` |
| D3 | Delivery | SFX peaked at 0 dBFS and played at 60%. Now 30%. | Medium | **Fixed** | measured: sfx max -0.1/-0.0 dB |
| D4 | Delivery | Final mix: before the fixes -13.4 LUFS with 0 dBFS-class peaks; after: **-15.3 LUFS integrated, true peak -1.3 dBFS, LRA 3.1 LU**. About 1.3 LU under the usual -14 target: acceptable (YouTube only turns loud videos down). | Low | Pass | `ffmpeg ebur128` |
| D5 | Delivery | The AI image behind the cost banner (workflow board, shot s4) contained garbled pseudo-text ("Cavalegon", "Tourthael"). Regenerated with a text-free prompt; the global style string now forbids text, letters, numbers, UI. | High | **Fixed** | `build/s4.png` |
| D6 | Delivery | Other AI shots checked: s1 has tiny code-like squiggles inside a terminal (reads as code, acceptable); s2 and s5 have only decorative digits. | Low | Pass | full-size stills |
| D7 | Delivery | Highlight arrow on the model row covered the `$0.00` value it was meant to prove. Moved outside the text and scaled down. | Medium | **Fixed** | still at 4.7 s |
| D8 | Delivery | Caption "That is the critical part **in** the game" is probably "**of** the game" (Whisper small, noisy audio). Not changed because I can't tell what you said. | Low | **Open (needs you)** | `assets/transcript/ZOOM0022.srt` |
| D9 | Delivery | Last word "DeepSeek" was dropped by the word-timestamp pass; re-inserted from the segment pass (timing 25.6-26.3 s is approximate). | Low | Fixed (documented) | `word_patches` in storyboard |
| D10 | Delivery | Safe zones: chips at y 150-240; captions bottom margin 330 px; cards between y 300 and 1330. Clear of the Shorts UI as far as I know the layout. | - | Pass (not tested in the app) | layout constants |
| D11 | Delivery | Pacing: hook 0-3.8, real UI + proof 3.9-8.9, indexing 8.9-10.9, scene 10.9-12.5, JEV sketch 12.5-18.0, scene 18-21, cost banner 21-24.3, formula 24.4-29.5. At most one full-screen card at a time. Banner and formula are 0.1 s apart; both are readable (3.3 s and 5.1 s). | - | Pass | timeline |
| D12 | Delivery | Technical: 29.6 s (limit 30), 1080x1920, H.264 + AAC, 13.4 MB. | - | Pass | `ffprobe` |
| V1 | Value | **Who/what:** developers who want frontier-quality agentic coding at a fraction of the cost. Promise: how to get DeepSeek to perform in Kilo CLI. | - | Pass | |
| V2 | Value | Real proof from your own screen: DeepSeek V4.1 Flash, **$0.00** cost, 94.2% cache rate, 33.9 tokens/s. Now explicitly highlighted (arrow on the model row at 4.3 s). | - | **Added** | status screenshot |
| V3 | Value | "**10x less cost** than a frontier model setup" (0:21) is a claim **you supplied**; the Short shows no comparison. Viewers will ask for the maths. Suggest a pinned comment with the two prices per 1M tokens, or "up to 10x" if it varies. Stored in `storyboard.json` -> banner.source as "user claim". | High | **Open (needs you)** | |
| V4 | Value | "Frontier-level results" was an unproven claim; softened to "**Frontier-like** results". No benchmark is shown. If you have a side-by-side, add it. | Medium | Softened; **proof Open** | |
| V5 | Value | The viewer learns the ingredients but not the steps (how to enable LSP, how to turn on indexing, what JEV does). I did not invent steps. Suggest: steps in the description or a pinned comment, and one follow-up Short per ingredient. | High | **Open (needs you)** | |
| V6 | Value | "JEV" is never explained on screen. The sketch implies JSON extraction/validation (my reading of `jev.webp`). Confirm and add a 3-word label if wrong. | Medium | **Open (needs you)** | |
| V7 | Value | Added a safe CTA, "Save this formula" (no promise you haven't made). | Low | **Added** | |

## Unverified claims (you must confirm)

1. "10x less cost than a frontier model setup" (and the word "cheap" in the opening teaser): your claim, not measured here.
2. "Frontier-like results": no benchmark in the Short.
3. JEV = JSON extraction/validation: my interpretation of your sketch.
4. "In the game" vs "of the game": transcript guess.

## Suggested publishing copy (edit freely)

- **Title options:** "Make DeepSeek work like a frontier model in Kilo CLI" · "Kilo CLI + DeepSeek: the formula"
  (avoid "10x cheaper" in the title until V3 is backed by numbers)
- **Description:** "Kilo CLI + LSP + Indexing + JEV + DeepSeek = frontier-like results. Steps: <add yours>. Save this formula."
- **Hashtags:** #Shorts #KiloCLI #DeepSeek #AICoding #LSP

## Before you publish

Play it end to end on a phone; resolve D8, V3, V5, V6; re-run `python3 scripts/prep_remotion.py && (cd remotion && npm run render)`.
