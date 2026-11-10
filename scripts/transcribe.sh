#!/usr/bin/env bash
# Clean a recording and transcribe it locally with OpenAI Whisper.
# Usage: scripts/transcribe.sh assets/audio/ZOOM0022.WAV [model]
set -euo pipefail
IN="${1:?audio file}"; MODEL="${2:-small}"
NAME="$(basename "${IN%.*}")"
mkdir -p build assets/transcript
ffmpeg -y -loglevel error -i "$IN" -af "highpass=f=80,loudnorm" -ac 1 -ar 16000 "build/$NAME.16k.wav"
whisper "build/$NAME.16k.wav" --model "$MODEL" --output_dir build/whisper --output_format all
cp "build/whisper/$NAME.16k.txt" "assets/transcript/$NAME.txt"
cp "build/whisper/$NAME.16k.srt" "assets/transcript/$NAME.srt"
echo "Beware: 'Thank you.' / 'Thanks for watching!' on a short file = Whisper hallucinating on silence."
