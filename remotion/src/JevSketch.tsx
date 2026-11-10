import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import data from '../public/data.json';

// Hand-drawn pencil-style vertical flow, redrawn from assets/images/jev.webp:
// server -> padlock -> gears (validate) -> blue (valid) / red (error) -> JSON document.
// Strokes "draw on" in sequence; no AI-generated text, so nothing is garbled.
const INK = '#2a2a2a';
const BLUE = '#1f5fbf';
const RED = '#c62828';
const CX = 540;

const gearPath = (cx: number, cy: number, r: number, teeth: number) => {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.78 : r;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return 'M' + pts.join('L') + 'Z';
};

type Seg = {d: string; at: number; dur: number; color?: string; w?: number; fill?: string};

export const JevSketch: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const j = data.jev;
  if (!j) return null;
  const t = frame / fps - j.start; // seconds since the sketch started
  if (t < -0.1 || frame / fps > j.end) return null;
  const fade = Math.min(
    interpolate(t, [0, 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(frame / fps, [j.end - 0.35, j.end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  const prog = (at: number, dur: number) => interpolate(t, [at, at + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const arrow = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}L${x2} ${y2}M${x2 - 16} ${y2 - 22}L${x2} ${y2}L${x2 + 16} ${y2 - 22}`;

  const segs: Seg[] = [
    // server rack (front, side, top, slots, vents)
    {d: `M${CX - 100} 300h200v210h-200z`, at: 0.0, dur: 0.6},
    {d: `M${CX + 100} 300l50 -30v210l-50 30M${CX - 100} 300l50 -30h200`, at: 0.3, dur: 0.5},
    {d: `M${CX - 80} 340h160M${CX - 80} 372h160M${CX - 80} 404h160M${CX - 80} 470h160M${CX - 80} 486h160`, at: 0.5, dur: 0.5},
    // arrow server -> node
    {d: arrow(CX, 515, CX, 600), at: 0.9, dur: 0.35},
    // padlock + dashed link to node
    {d: `M${CX - 250} 640h70v56h-70zM${CX - 238} 640v-24a23 23 0 0 1 46 0v24`, at: 1.2, dur: 0.5},
    {d: `M${CX - 180} 665h132`, at: 1.6, dur: 0.3, w: 3},
    // arrow node -> diamond
    {d: arrow(CX, 650, CX, 720), at: 1.8, dur: 0.3},
    // validator diamond
    {d: `M${CX} 725L${CX + 120} 835L${CX} 945L${CX - 120} 835Z`, at: 2.0, dur: 0.6},
    // blue (valid) branch and red (error) branch
    {d: `M${CX - 120} 835C${CX - 280} 835 ${CX - 300} 960 ${CX - 170} 1010M${CX - 190} 990L${CX - 170} 1012L${CX - 145} 996`, at: 2.7, dur: 0.5, color: BLUE, w: 7},
    {d: `M${CX + 120} 835C${CX + 280} 835 ${CX + 300} 960 ${CX + 170} 1010M${CX + 190} 990L${CX + 170} 1012L${CX + 145} 996`, at: 3.1, dur: 0.5, color: RED, w: 7},
    // check and cross marks
    {d: `M${CX - 330} 905l22 24l44 -56`, at: 3.5, dur: 0.3, color: BLUE, w: 9},
    {d: `M${CX + 285} 880l50 50M${CX + 335} 880l-50 50`, at: 3.7, dur: 0.3, color: RED, w: 9},
    // JSON document
    {d: `M${CX - 190} 1025h380v270h-380z`, at: 3.3, dur: 0.6},
    {d: `M${CX - 40} 1080h110M${CX - 40} 1120h80M${CX + 20} 1170h110M${CX + 20} 1210h70`, at: 4.0, dur: 0.5, color: BLUE, w: 7},
  ];

  const gearA = 25 * t, gearB = -25 * t;
  const gearsOn = prog(2.4, 0.4);

  return (
    <AbsoluteFill style={{opacity: fade, background: '#f3efe6'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs>
          {/* pencil wobble + paper grain */}
          <filter id="pencil"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="5" /></filter>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.25 0" /></filter>
        </defs>
        <rect width={1080} height={1920} filter="url(#grain)" opacity={0.5} />
        <g filter="url(#pencil)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {segs.map((s, i) => (
            <path key={i} d={s.d} pathLength={1} stroke={s.color ?? INK} strokeWidth={s.w ?? 5}
              strokeDasharray={1} strokeDashoffset={1 - prog(s.at, s.dur)} />
          ))}
          {/* LEDs + node */}
          <circle cx={CX - 60} cy={440} r={9} fill={BLUE} opacity={prog(0.9, 0.2)} stroke="none" />
          <circle cx={CX - 30} cy={440} r={9} fill={BLUE} opacity={prog(1.0, 0.2)} stroke="none" />
          <circle cx={CX} cy={625} r={24} stroke={BLUE} strokeWidth={6} fill="#cfe0f7"
            opacity={prog(1.2, 0.3)} />
          {/* spinning gears inside the validator */}
          <g opacity={gearsOn}>
            <path d={gearPath(CX - 22, 825, 46, 8)} stroke={INK} strokeWidth={5} fill="#d9d5cb"
              transform={`rotate(${gearA} ${CX - 22} 825)`} />
            <path d={gearPath(CX + 38, 868, 30, 7)} stroke={INK} strokeWidth={5} fill="#d9d5cb"
              transform={`rotate(${gearB} ${CX + 38} 868)`} />
          </g>
          {/* JSON braces */}
          <g opacity={prog(3.9, 0.4)} fill={INK} stroke="none" fontFamily="Menlo, monospace" fontSize={150}>
            <text x={CX - 160} y={1180}>{'{'}</text>
            <text x={CX + 100} y={1262}>{'}'}</text>
          </g>
        </g>
        {/* friendly label */}
        <g opacity={prog(0.2, 0.4)} transform="rotate(-6 150 420)">
          <text x={90} y={440} fontFamily="Marker Felt, Chalkboard SE, Comic Sans MS, sans-serif" fontSize={120}
            fontWeight={700} fill={BLUE}>JEV</text>
          <path d="M90 465 Q 200 490 330 458" stroke={BLUE} strokeWidth={8} fill="none" strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog(0.7, 0.4)} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
