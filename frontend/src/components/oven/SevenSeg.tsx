interface Props {
  value: string;
  className?: string;
}

// Renders text in the seven-segment LCD font, with a faint "all-on" ghost
// layer behind it — the way real segment displays show unlit segments.
// The ghost replaces every char with '8' (digits) or '~' (separators).
export default function SevenSeg({ value, className }: Props) {
  const ghost = value
    .split('')
    .map((c) => (/[0-9]/.test(c) ? '8' : c === ':' ? ':' : c === ' ' ? ' ' : c))
    .join('');
  return (
    <span className={`seg ${className ?? ''}`} data-ghost={ghost}>
      {value}
    </span>
  );
}
