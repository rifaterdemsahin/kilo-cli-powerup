import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {data} from './data';

const CYAN = '#22d3ee';
const YEL = '#facc15';
const stroke = {WebkitTextStroke: '10px rgba(0,0,0,.85)', paintOrder: 'stroke fill'} as React.CSSProperties;

// Thumbnail still (1080x1920). Text comes from storyboard.json -> thumbnail. No unproven claims on it.
export const Thumb: React.FC = () => {
  const t = data.thumbnail;
  if (!t) return null;
  return (
    <AbsoluteFill style={{background: '#000', fontFamily: 'Helvetica, Arial, sans-serif', textAlign: 'center'}}>
      {t.image && <Img src={staticFile(t.image)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.12)'}} />}
      <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.15) 42%, rgba(0,0,0,.85))'}} />
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{padding: '20px 56px', borderRadius: 999, background: CYAN, color: '#06121a', fontWeight: 900, fontSize: 64,
          letterSpacing: 3, boxShadow: `0 0 50px ${CYAN}aa`}}>{t.chip}</div>
      </div>
      <div style={{position: 'absolute', top: 560, left: 40, right: 40}}>
        <div style={{fontWeight: 900, fontSize: 162, lineHeight: 1, color: CYAN, textShadow: `0 0 60px ${CYAN}`, ...stroke}}>{t.big}</div>
        <div style={{fontWeight: 900, fontSize: 135, lineHeight: 1.1, marginTop: 24, color: YEL, textShadow: `0 0 50px ${YEL}`, ...stroke}}>{t.accent}</div>
      </div>
      <div style={{position: 'absolute', bottom: 260, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{padding: '22px 60px', borderRadius: 24, background: 'rgba(8,12,28,.85)', border: `5px solid ${YEL}`, color: '#fff',
          fontWeight: 900, fontSize: 70, letterSpacing: 2}}>{t.foot}</div>
      </div>
    </AbsoluteFill>
  );
};
