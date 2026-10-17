import type { CSSProperties } from 'react';

type DecoName = 'kettle' | 'leaf' | 'tomato' | 'orange' | 'beet' | 'dumbbell';

export function PaintDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="rough" x="-5%" y="-60%" width="110%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.07" numOctaves="4" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="48" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="wc" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="4" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="4" />
        </filter>
        <radialGradient id="gTom" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#FF8A6B" />
          <stop offset="1" stopColor="#D63D25" />
        </radialGradient>
        <radialGradient id="gOrg" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#FFC25A" />
          <stop offset="1" stopColor="#F08A1C" />
        </radialGradient>
        <radialGradient id="gBeet" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#E0608C" />
          <stop offset="1" stopColor="#8B2D5B" />
        </radialGradient>

        <symbol id="i-kettle" viewBox="0 0 120 120">
          <g filter="url(#wc)">
            <path d="M38 42C36 12 84 12 82 42" fill="none" stroke="#A9AFB5" strokeWidth="9" strokeLinecap="round" />
            <circle cx="60" cy="74" r="38" fill="url(#gTom)" />
            <ellipse cx="45" cy="58" rx="12" ry="19" fill="#fff" opacity=".25" transform="rotate(25 45 58)" />
            <path d="M30 90C46 110 78 110 92 90" fill="none" stroke="#8E2615" strokeWidth="5" opacity=".35" />
          </g>
        </symbol>

        <symbol id="i-tomato" viewBox="0 0 120 120">
          <g filter="url(#wc)">
            <circle cx="60" cy="68" r="40" fill="url(#gTom)" />
            <ellipse cx="44" cy="52" rx="10" ry="15" fill="#fff" opacity=".28" transform="rotate(25 44 52)" />
            <path d="M60 30c-6 8-18 8-24 6 6 2 12 8 24 4 12 4 18-2 24-4-6 2-18 2-24-6z" fill="#5E8C2E" />
            <path d="M60 34V20" stroke="#4F7A2B" strokeWidth="5" strokeLinecap="round" />
          </g>
        </symbol>

        <symbol id="i-orange" viewBox="0 0 120 120">
          <g filter="url(#wc)">
            <circle cx="60" cy="60" r="46" fill="url(#gOrg)" />
            <circle cx="60" cy="60" r="38" fill="#FFE2A8" />
            <g stroke="#F6B04A" strokeWidth="3" strokeLinecap="round">
              <path d="M60 24V96M24 60H96M34 34L86 86M86 34L34 86" />
            </g>
            <circle cx="60" cy="60" r="6" fill="#FFF3D6" />
          </g>
        </symbol>

        <symbol id="i-beet" viewBox="0 0 120 140">
          <g filter="url(#wc)">
            <path
              d="M60 4C46 22 52 34 56 44M60 4C72 20 70 34 64 44M60 6C60 22 60 34 60 44"
              fill="none"
              stroke="#4F7A2B"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path d="M40 22C26 22 22 36 36 40C44 42 50 34 40 22zM80 22C94 22 98 36 84 40C76 42 70 34 80 22z" fill="#6E9B3C" />
            <circle cx="60" cy="86" r="36" fill="url(#gBeet)" />
            <path d="M60 120C58 130 62 136 66 140" stroke="#8B2D5B" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="46" cy="72" rx="9" ry="14" fill="#fff" opacity=".25" transform="rotate(25 46 72)" />
          </g>
        </symbol>

        <symbol id="i-leaf" viewBox="0 0 160 160">
          <g filter="url(#wc)">
            <path d="M20 150C50 110 90 70 140 14" fill="none" stroke="#4F7A2B" strokeWidth="5" strokeLinecap="round" />
            <g fill="#6E9B3C">
              <ellipse cx="96" cy="48" rx="26" ry="12" transform="rotate(-50 96 48)" />
              <ellipse cx="116" cy="66" rx="26" ry="12" transform="rotate(10 116 66)" fill="#7FAF48" />
              <ellipse cx="62" cy="76" rx="26" ry="12" transform="rotate(-85 62 76)" fill="#5E8C2E" />
              <ellipse cx="86" cy="96" rx="26" ry="12" transform="rotate(15 86 96)" fill="#7FAF48" />
              <ellipse cx="38" cy="112" rx="24" ry="11" transform="rotate(-70 38 112)" />
              <ellipse cx="56" cy="132" rx="24" ry="11" transform="rotate(20 56 132)" fill="#5E8C2E" />
            </g>
          </g>
        </symbol>

        <symbol id="i-dumbbell" viewBox="0 0 160 80">
          <g filter="url(#wc)">
            <rect x="40" y="34" width="80" height="12" rx="6" fill="#A9AFB5" />
            <rect x="18" y="14" width="22" height="52" rx="8" fill="#6E9B3C" />
            <rect x="6" y="24" width="14" height="32" rx="6" fill="#4F7A2B" />
            <rect x="120" y="14" width="22" height="52" rx="8" fill="#6E9B3C" />
            <rect x="140" y="24" width="14" height="32" rx="6" fill="#4F7A2B" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

type DecoProps = {
  name: DecoName;
  style: CSSProperties;
  hideOnSmall?: boolean;
};

export function Deco({ name, style, hideOnSmall = false }: DecoProps) {
  return (
    <svg className={hideOnSmall ? 'deco deco--hide-m' : 'deco'} style={style} aria-hidden="true" focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  );
}

export function Rip({ edge }: { edge: 'top' | 'bottom' }) {
  return <div className={`rip rip--${edge === 'top' ? 't' : 'b'}`} aria-hidden="true" />;
}
