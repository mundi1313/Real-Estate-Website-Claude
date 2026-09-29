// Placeholder artwork until real MLS® photos arrive from the Bridge feed.
// Deterministic per MLS number so each listing keeps its own look.
const palettes = [
  ["#cfe3f2", "#8fb6d3", "#f3c98b"],
  ["#f5dcc2", "#e3a877", "#7fa3bf"],
  ["#d7e8dc", "#8bb59b", "#f0cf8a"],
  ["#e4dcf0", "#a99bc9", "#f2c4a0"],
  ["#dbe7ee", "#7fa1b8", "#eab26b"],
];

export default function PropertyArt({ seed, type = "Detached", className = "" }: { seed: string; type?: string; className?: string }) {
  const n = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [sky, wall, glow] = palettes[n % palettes.length];
  const tall = type === "Condo";
  return (
    <svg viewBox="0 0 400 260" className={className} role="img" aria-label="Photo placeholder" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="260" fill={sky} />
      <circle cx={80 + (n % 6) * 40} cy="60" r="26" fill={glow} opacity=".8" />
      <rect y="200" width="400" height="60" fill="#0e2238" opacity=".12" />
      {tall ? (
        <g>
          <rect x="130" y="40" width="140" height="180" rx="4" fill={wall} />
          {Array.from({ length: 5 }).flatMap((_, r) =>
            Array.from({ length: 3 }).map((__, c) => (
              <rect key={`${r}-${c}`} x={148 + c * 42} y={58 + r * 32} width="26" height="18" rx="2" fill="#fff" opacity={(r + c + n) % 4 === 0 ? 0.95 : 0.55} />
            )),
          )}
        </g>
      ) : (
        <g>
          <rect x="110" y="110" width="180" height="110" fill={wall} />
          <polygon points="95,112 200,50 305,112" fill="#0e2238" opacity=".78" />
          <rect x="185" y="152" width="30" height="68" rx="3" fill="#0e2238" opacity=".75" />
          <rect x="128" y="138" width="38" height="34" rx="2" fill="#fff" opacity=".85" />
          <rect x="234" y="138" width="38" height="34" rx="2" fill="#fff" opacity=".85" />
        </g>
      )}
    </svg>
  );
}
