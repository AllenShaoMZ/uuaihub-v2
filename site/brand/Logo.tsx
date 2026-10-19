// UU AI Hub 的品牌标记：圆角紫罗兰底上的白色 U 形 ＋ 枢纽圆点。
// Wordmark 在页面上画站名（size 是高度，单位像素）；Mark 是小标记，转起来就是加载动画。
import { SITE } from "../site.ts";

/** 站名前的图形标记：logo.svg 的行内版（深色底上用 currentColor 兜底时保持可读）。 */
export function Mark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} className={className} aria-hidden="true">
      <rect x="16" y="16" width="480" height="480" rx="112" fill="#7c3aed" />
      <path d="M176 148 V296 a80 80 0 0 0 160 0 V148" fill="none" stroke="#ffffff" stroke-width="62" stroke-linecap="round" />
      <circle cx="256" cy="298" r="27" fill="#ffffff" />
    </svg>
  );
}

export function Wordmark({ size = 24, className = "", title = SITE.name }: { size?: number; className?: string; title?: string }) {
  return (
    <span className={`inline-flex items-center font-extrabold leading-none tracking-[-0.02em] ${className}`} style={{ fontSize: Math.round(size * 0.88) }} aria-label={title} role="img">
      <Mark size={Math.round(size * 1.05)} />
      <span aria-hidden="true" className="ml-[0.42em]">{SITE.name}</span>
    </span>
  );
}

/** 一颗绕着圆点公转的小方块；转起来就是加载动画。 */
export function RingMark({ className = "", spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="2.4" fill="currentColor" opacity="0.9" />
      <g style={spinning ? { transformOrigin: "12px 12px", animation: "spin-slow 1.1s linear infinite" } : undefined}>
        <rect x="16.6" y="10.2" width="3.6" height="3.6" rx="1.2" fill="currentColor" opacity="0.55" />
      </g>
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.22" />
    </svg>
  );
}
