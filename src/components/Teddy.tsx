/** Superhelden-Teddy mit Cape – lokale SVG-Illustration. */
export function Teddy({ size = 180, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Superhelden-Teddy mit Cape">
      <defs>
        <linearGradient id="cape" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5cbf" />
          <stop offset="1" stopColor="#c2338a" />
        </linearGradient>
      </defs>
      {/* Cape */}
      <path d="M58 92 Q30 150 40 188 L100 172 L160 188 Q170 150 142 92 Z" fill="url(#cape)" />
      {/* Körper */}
      <ellipse cx="100" cy="140" rx="42" ry="44" fill="#b9763f" />
      <ellipse cx="100" cy="148" rx="26" ry="28" fill="#e2b07a" />
      {/* Arme */}
      <ellipse cx="56" cy="126" rx="14" ry="24" fill="#b9763f" transform="rotate(25 56 126)" />
      <ellipse cx="148" cy="112" rx="14" ry="24" fill="#b9763f" transform="rotate(-150 148 112)" />
      {/* Füsse */}
      <ellipse cx="78" cy="182" rx="16" ry="11" fill="#9c6131" />
      <ellipse cx="122" cy="182" rx="16" ry="11" fill="#9c6131" />
      {/* Brustemblem */}
      <path d="M100 126 l14 8 v16 l-14 9 l-14 -9 v-16 z" fill="#ffd43b" stroke="#0b1433" strokeWidth="3" />
      <text x="100" y="149" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="18" fill="#0b1433">A</text>
      {/* Kopf */}
      <circle cx="64" cy="40" r="17" fill="#b9763f" />
      <circle cx="136" cy="40" r="17" fill="#b9763f" />
      <circle cx="64" cy="40" r="8" fill="#e2b07a" />
      <circle cx="136" cy="40" r="8" fill="#e2b07a" />
      <circle cx="100" cy="70" r="44" fill="#c48249" />
      {/* Maske */}
      <path d="M62 62 Q100 46 138 62 Q138 80 118 78 Q100 70 82 78 Q62 80 62 62 Z" fill="#3ad7ff" />
      <circle cx="84" cy="66" r="6" fill="#0b1433" />
      <circle cx="116" cy="66" r="6" fill="#0b1433" />
      <circle cx="86" cy="64" r="2" fill="#fff" />
      <circle cx="118" cy="64" r="2" fill="#fff" />
      <ellipse cx="100" cy="90" rx="18" ry="13" fill="#e2b07a" />
      <ellipse cx="100" cy="85" rx="7" ry="5" fill="#3b2412" />
      <path d="M90 95 Q100 104 110 95" stroke="#3b2412" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
