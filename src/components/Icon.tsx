interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number, className: string | undefined) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
}

export function ArchMark({ size = 26, className }: IconProps) {
  return (
    <svg {...base(size, className)} viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M4 20V11a8 8 0 0 1 16 0v9" />
      <path d="M9 20v-7a3 3 0 0 1 6 0v7" />
      <path d="M2 20h20" />
    </svg>
  );
}

export function HelpIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9a2.5 2.5 0 0 1 4.9.7c0 1.8-2.5 2-2.5 3.8" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}

export function StatsIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 20V13" />
      <path d="M12 20V6" />
      <path d="M19 20V10" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function CloseIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 12h16" />
      <path d="M14 6l6 6-6 6" />
    </svg>
  );
}

export function ShareIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}
