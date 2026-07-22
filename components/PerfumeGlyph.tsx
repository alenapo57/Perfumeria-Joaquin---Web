type Props = {
  accent: string;
  className?: string;
};

/**
 * Silueta simple de un frasco de perfume. Se usa como placeholder
 * mientras no haya fotos reales de producto cargadas (image_url es
 * null en toda la migración inicial). El tono cambia según la
 * categoría, así la grilla no se ve toda igual aunque falten fotos.
 */
export function PerfumeGlyph({ accent, className }: Props) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <rect x="38" y="8" width="24" height="14" rx="3" fill={accent} opacity="0.55" />
      <rect x="44" y="2" width="12" height="8" rx="2" fill={accent} opacity="0.75" />
      <path
        d="M30 30 C30 24 34 22 40 22 H60 C66 22 70 24 70 30 V102 C70 110 64 116 56 116 H44 C36 116 30 110 30 102 Z"
        fill={accent}
        opacity="0.18"
        stroke={accent}
        strokeWidth="1.5"
      />
      <rect x="34" y="52" width="32" height="34" rx="2" fill={accent} opacity="0.28" />
    </svg>
  );
}
