import React from 'react';
import {
  AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {data} from './data';
import {JevSketch} from './JevSketch';

const CYAN = '#22d3ee';
const VIOLET = '#a78bfa';
const KEYWORDS = /^(kilo|cli|lsp|indexing|deepseek|frontier|models?|critical)\W*$/i;

type Shot = (typeof data.shots)[number];

// ---------- backgrounds ----------
// Uses the fal.ai image/clip when present, otherwise a procedural neon placeholder.
const Placeholder: React.FC<{seed: string}> = ({seed}) => {
  const frame = useCurrentFrame();
  const hue = Math.floor(random(seed) * 60) + 190; // cyan -> violet range
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, hsl(${hue},60%,8%), hsl(${hue + 50},70%,14%))`}}>
      {Array.from({length: 14}).map((_, i) => {
        const x = random(`${seed}x${i}`) * 1080;
        const y0 = random(`${seed}y${i}`) * 1920;
        const y = (y0 - frame * (1 + random(`${seed}s${i}`) * 2) + 1920 * 10) % 1920;
        const w = 120 + random(`${seed}w${i}`) * 420;
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, width: w, height: 10, borderRadius: 6,
            background: i % 2 ? CYAN : VIOLET, opacity: 0.35,
            boxShadow: `0 0 24px ${i % 2 ? CYAN : VIOLET}`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

const ShotLayer: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dur = (shot.end - shot.start) * fps;
  const scale = interpolate(frame, [0, dur], [1.04, 1.18]); // Ken Burns
  const fade = Math.min(
    interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [dur - 8, dur], [1, 0], {extrapolateLeft: 'clamp'}),
  );
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        {shot.video ? (
          <Freeze frame={Math.min(frame, Math.max(0, Math.floor(((shot as {videoSeconds?: number}).videoSeconds ?? 99) * fps) - 3))}>
            <OffthreadVideo src={staticFile(shot.video)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </Freeze>
        ) : shot.image ? (
          <Img src={staticFile(shot.image)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <Placeholder seed={shot.id} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(transparent 45%, rgba(0,0,0,0.75))'}} />
    </AbsoluteFill>
  );
};

// ---------- top label chip ----------
const Chip: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame, fps, config: {damping: 14}});
  return (
    <div style={{
      position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center',
      transform: `translateY(${(1 - p) * -60}px)`, opacity: p,
    }}>
      <div style={{
        padding: '18px 44px', borderRadius: 999, fontSize: 46, fontWeight: 700, letterSpacing: 1,
        color: '#06121a', background: CYAN, boxShadow: `0 0 40px ${CYAN}99`, fontFamily: 'Helvetica, Arial, sans-serif',
      }}>{text}</div>
    </div>
  );
};

// ---------- animated subtitles ----------
// Group words into short phrases; each word springs in, the active word pops and glows.
type W = (typeof data.words)[number];
const phrases = (() => {
  const out: W[][] = [];
  let cur: W[] = [];
  data.words.forEach((w, i) => {
    cur.push(w);
    const next = data.words[i + 1];
    const gap = next ? next.start - w.end : 99;
    if (cur.length >= 4 || /[.,!?]$/.test(w.text) || gap > 0.5) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
})();

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const idx = phrases.findIndex((p, i) => {
    const end = phrases[i + 1] ? phrases[i + 1][0].start : p[p.length - 1].end + 0.6;
    return t >= p[0].start - 0.05 && t < end;
  });
  if (idx < 0) return null;
  const phrase = phrases[idx];
  return (
    <div style={{
      position: 'absolute', left: 60, right: 60, bottom: 330, display: 'flex', flexWrap: 'wrap',
      justifyContent: 'center', gap: '10px 22px', fontFamily: 'Helvetica, Arial, sans-serif',
    }}>
      {phrase.map((w, i) => {
        const startF = Math.round(w.start * fps);
        const entry = spring({frame: frame - startF + 3, fps, config: {damping: 11, stiffness: 180}});
        const active = t >= w.start && t < w.end;
        const key = KEYWORDS.test(w.text);
        const pop = active ? 1 + 0.12 * Math.sin(Math.min(1, (t - w.start) / 0.25) * Math.PI) : 1;
        const color = active ? CYAN : key ? VIOLET : '#fff';
        return (
          <span key={i} style={{
            display: 'inline-block', fontSize: key ? 104 : 92, fontWeight: 900, color,
            textTransform: 'uppercase', opacity: Math.min(1, entry * 1.4),
            transform: `translateY(${(1 - entry) * 50}px) scale(${entry * pop})`,
            textShadow: `0 6px 0 rgba(0,0,0,.55), 0 0 ${active ? 36 : 0}px ${color}`,
            WebkitTextStroke: '6px rgba(0,0,0,.85)', paintOrder: 'stroke fill',
          }}>{w.text}</span>
        );
      })}
    </div>
  );
};


// ---------- screenshot callouts with a moving arrow ----------
// Each callout shows one of the user's screenshots; the arrow points at the current target
// and glides to the next target when its time comes. Layout lives in storyboard.json -> callouts.
type CalloutCfg = (typeof data.callouts)[number];
const Callout: React.FC<{c: CalloutCfg}> = ({c}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (!c.image || t < c.start || t > c.end) return null;
  const local = frame - Math.round(c.start * fps);
  const enter = spring({frame: local, fps, config: {damping: 13}});
  const exit = interpolate(t, [c.end - 0.25, c.end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const h = c.width * (c.aspect[1] / c.aspect[0]);

  const idx = Math.max(0, c.targets.reduce((n, tg, i) => (t >= tg.at ? i : n), 0));
  const cur = c.targets[idx];
  const prev = c.targets[Math.max(0, idx - 1)];
  const glide = idx === 0 ? 1 : spring({frame: frame - Math.round(cur.at * fps), fps, config: {damping: 16, stiffness: 120}});
  const L = (k: 'arrowX' | 'arrowY' | 'boxX' | 'boxW' | 'boxY' | 'boxH') => interpolate(glide, [0, 1], [prev[k], cur[k]]);
  const arrowIn = spring({frame: frame - Math.round(c.targets[0].at * fps), fps, config: {damping: 10, stiffness: 140}});
  const bob = Math.sin(t * 9) * 14;
  const pulse = 0.6 + 0.4 * Math.sin(t * 8);
  const YEL = '#facc15';

  return (
    <AbsoluteFill style={{opacity: exit}}>
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.55)', opacity: enter}} />
      <Img src={staticFile(c.image)} style={{
        position: 'absolute', left: c.x, top: c.y, width: c.width, height: h, borderRadius: 28,
        transform: `scale(${0.85 + 0.15 * enter})`, opacity: enter,
        boxShadow: `0 0 0 4px ${CYAN}, 0 0 60px ${CYAN}88`,
      }} />
      {t >= c.targets[0].at - 0.2 && (
        <>
          <div style={{
            position: 'absolute', left: L('boxX'), width: L('boxW'), top: L('boxY'), height: L('boxH'),
            border: `5px solid ${YEL}`, borderRadius: 14, opacity: arrowIn * pulse, boxShadow: `0 0 28px ${YEL}`,
          }} />
          <svg width={420} height={150} viewBox="0 0 420 150" style={{
            position: 'absolute', left: L('arrowX') + (1 - arrowIn) * 400 + bob, top: L('arrowY') - 75,
            filter: `drop-shadow(0 0 18px ${YEL})`,
            transform: `scale(${(cur as {arrowScale?: number}).arrowScale ?? 1})`, transformOrigin: '0 50%',
          }}>
            <path d="M0 75 L70 10 L70 52 L420 52 L420 98 L70 98 L70 140 Z" fill={YEL} stroke="#000" strokeWidth={6} strokeLinejoin="round" />
          </svg>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------- hook at the start ----------
// 1) curiosity trigger (teaser) slams in on frame 0, 2) the question types itself out in a card.
// Teaser lines are separated by "|" in storyboard.json -> hook.teaser. Key words are coloured.
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const h = data.hook;
  if (!h) return null;
  const t = frame / fps;
  if (t > h.end) return null;
  const exit = interpolate(t, [h.end - 0.35, h.end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tz = spring({frame, fps, config: {damping: 9, stiffness: 220}});
  const jitter = t < 0.45 ? Math.sin(frame * 3) * 8 * (1 - t / 0.45) : 0; // quick glitch on arrival
  const enter = spring({frame: frame - Math.round(h.start * fps), fps, config: {damping: 12}});
  const words = h.text.split(' ');
  const perWord = 0.12;
  return (
    <>
      {h.teaser && (
        <div style={{
          position: 'absolute', top: 270, left: 0, right: 0, textAlign: 'center', fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 900, fontSize: 78, lineHeight: 1.1, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2,
          opacity: exit * Math.min(1, tz * 1.5), transform: `translateX(${jitter}px) scale(${0.7 + 0.3 * tz})`,
          textShadow: '0 0 40px #facc15, 0 6px 0 rgba(0,0,0,.7)', WebkitTextStroke: '5px rgba(0,0,0,.8)', paintOrder: 'stroke fill',
        }}>
          {h.teaser.split('|').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
      <div style={{
        position: 'absolute', left: 70, right: 70, top: 500, padding: '46px 52px', borderRadius: 44,
        background: 'rgba(8,12,28,0.82)', border: `5px solid ${VIOLET}`, boxShadow: `0 0 60px ${VIOLET}99`,
        opacity: exit * Math.min(1, enter * 1.5), transform: `scale(${0.8 + 0.2 * enter}) rotate(${(1 - enter) * -4}deg)`,
        fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 900, fontSize: 84, lineHeight: 1.15, textAlign: 'center',
      }}>
        {words.map((w, i) => {
          const at = h.start + 0.3 + i * perWord;
          const shown = t >= at;
          const hl = h.highlight.some((k) => w.toLowerCase().startsWith(k.toLowerCase()));
          const pop = shown ? spring({frame: frame - Math.round(at * fps), fps, config: {damping: 10, stiffness: 200}}) : 0;
          return (
            <span key={i} style={{
              display: 'inline-block', marginRight: 18, opacity: shown ? 1 : 0, transform: `scale(${0.6 + 0.4 * pop})`,
              color: hl ? (w.toLowerCase().startsWith('deep') ? CYAN : VIOLET) : '#fff',
              textShadow: hl ? `0 0 26px ${w.toLowerCase().startsWith('deep') ? CYAN : VIOLET}` : 'none',
            }}>{w}</span>
          );
        })}
      </div>
    </>
  );
};

// ---------- "why bother?" value banner ----------
// Question, then the answer (e.g. a cost claim) pops in big. Text lives in storyboard.json -> banner.
const Banner: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b = data.banner;
  if (!b) return null;
  const t = frame / fps;
  if (t < b.start || t > b.end) return null;
  const enter = spring({frame: frame - Math.round(b.start * fps), fps, config: {damping: 13}});
  const ans = spring({frame: frame - Math.round((b.start + 0.9) * fps), fps, config: {damping: 9, stiffness: 190}});
  const exit = interpolate(t, [b.end - 0.3, b.end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glow = 0.6 + 0.4 * Math.sin(t * 7);
  return (
    <div style={{
      position: 'absolute', left: 70, right: 70, top: 330, padding: '48px 44px', borderRadius: 48, textAlign: 'center',
      background: 'rgba(8,12,28,0.84)', border: `5px solid #facc15`, boxShadow: '0 0 60px #facc1588',
      opacity: exit * Math.min(1, enter * 1.5), transform: `scale(${0.85 + 0.15 * enter})`,
      fontFamily: 'Helvetica, Arial, sans-serif',
    }}>
      <div style={{fontSize: 58, fontWeight: 800, color: '#fff', lineHeight: 1.2}}>{b.question}</div>
      <div style={{
        marginTop: 22, fontSize: 150, fontWeight: 900, color: '#facc15', lineHeight: 1,
        opacity: Math.min(1, ans * 1.4), transform: `scale(${0.5 + 0.5 * ans})`,
        textShadow: `0 0 ${50 * glow}px #facc15`, textTransform: 'uppercase',
      }}>{b.answer}</div>
      <div style={{marginTop: 18, fontSize: 56, fontWeight: 800, color: CYAN, opacity: Math.min(1, ans * 1.4)}}>{b.sub}</div>
    </div>
  );
};

// ---------- closing formula ----------
const Formula: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = data.formula;
  if (!f) return null;
  const t = frame / fps;
  if (t < f.start) return null;
  const panel = spring({frame: frame - Math.round(f.start * fps), fps, config: {damping: 14}});
  const pop = (at: number) => spring({frame: frame - Math.round(at * fps), fps, config: {damping: 10, stiffness: 170}});
  const resP = pop(f.result.at);
  const glow = 0.6 + 0.4 * Math.sin(t * 7);
  return (
    <div style={{
      position: 'absolute', left: 90, right: 90, top: 300, padding: '44px 40px 52px', borderRadius: 48,
      background: 'rgba(6,10,24,0.86)', border: `5px solid ${CYAN}`, boxShadow: `0 0 70px ${CYAN}88`,
      opacity: panel, transform: `scale(${0.85 + 0.15 * panel})`, fontFamily: 'Helvetica, Arial, sans-serif',
      textAlign: 'center',
    }}>
      {f.terms.map((term, i) => {
        const p = pop(term.at);
        return (
          <div key={term.t} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, fontWeight: 900, fontSize: 92,
            opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * -120}px) scale(${0.7 + 0.3 * p})`,
            color: i % 2 ? VIOLET : '#fff', lineHeight: 1.25,
          }}>
            <span style={{width: 60, color: CYAN}}>{i === 0 ? '' : '+'}</span>
            <span style={{minWidth: 520, textAlign: 'left'}}>{term.t}</span>
          </div>
        );
      })}
      <div style={{height: 8, margin: '22px 40px', borderRadius: 4, background: CYAN, opacity: resP,
        transform: `scaleX(${resP})`, boxShadow: `0 0 24px ${CYAN}`}} />
      <div style={{
        fontWeight: 900, fontSize: 88, color: '#facc15', opacity: Math.min(1, resP * 1.4),
        transform: `scale(${0.6 + 0.4 * resP})`, textShadow: `0 0 ${40 * glow}px #facc15`,
      }}>= {f.result.t}</div>
      {f.cta && (
        <div style={{marginTop: 26, fontWeight: 800, fontSize: 52, color: '#fff', letterSpacing: 2,
          opacity: pop(f.cta.at), textTransform: 'uppercase'}}>{f.cta.t}</div>
      )}
    </div>
  );
};

// ---------- progress bar ----------
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 0, bottom: 0, height: 14, width: `${(frame / durationInFrames) * 100}%`,
      background: `linear-gradient(90deg, ${CYAN}, ${VIOLET})`}} />
  );
};

export const Short: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {data.shots.map((s) => (
        <Sequence key={s.id} from={Math.round(s.start * fps)} durationInFrames={Math.round((s.end - s.start) * fps)}>
          <ShotLayer shot={s} />
          <Chip text={s.label} />
          {s.sfx && <Audio src={staticFile(s.sfx)} volume={0.3} startFrom={0} />}
        </Sequence>
      ))}
      <JevSketch />
      {data.callouts.map((c) => <Callout key={c.id} c={c} />)}
      <Hook />
      <Banner />
      <Formula />
      <Subtitles />
      <Progress />
      {data.voice && (data.voiceTrim ? (
        <Sequence from={Math.round(data.voiceTrim.at * fps)}>
          <Audio src={staticFile(data.voice)} startFrom={Math.round(data.voiceTrim.from * fps)} />
        </Sequence>
      ) : <Audio src={staticFile(data.voice)} />)}
      {data.music && <Audio src={staticFile(data.music)} loop volume={(f) => {
        const tt = f / fps;
        const speaking = data.words.some((w) => tt >= w.start - 0.15 && tt <= w.end + 0.25);
        const fadeOut = interpolate(f, [data.duration * fps - 45, data.duration * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (speaking ? 0.06 : 0.2) * fadeOut; // duck under the voice, swell in the gaps
      }} />}
    </AbsoluteFill>
  );
};
