type Props = {
  className?: string;
};

export default function Logo({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 62"
      fill="none"
      aria-label="Cookezy"
      className={className}
    >
      {/* Anneau de la cloche — centré à x=80 */}
      <circle cx="80" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
      {/* Dôme */}
      <path
        d="M 60 30 A 20 22 0 0 1 100 30"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Reflet */}
      <path
        d="M 67 21 Q 69 13 75 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Plateau */}
      <rect
        x="58"
        y="30"
        width="44"
        height="5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Texte centré sous la cloche */}
      <text
        x="80"
        y="56"
        textAnchor="middle"
        fontFamily="var(--font-dm-sans), system-ui, sans-serif"
        fontSize="22"
        fontWeight="700"
        fill="currentColor"
      >
        Cookezy
      </text>
    </svg>
  );
}
