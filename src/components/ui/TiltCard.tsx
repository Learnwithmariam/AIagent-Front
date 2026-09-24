import React, { useRef } from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max rotation in degrees */
  intensity?: number;
  children: React.ReactNode;
}

/**
 * Subtle 3D hover: the card rotates toward the pointer, lifts, and a soft magenta glare
 * follows the cursor. Pointer-only (no effect on touch) and disabled for reduced motion via CSS.
 */
export const TiltCard: React.FC<TiltCardProps> = ({ intensity = 6, className = '', style, children, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.dataset.active = 'true';
      el.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * intensity}deg) rotateY(${(px - 0.5) * intensity}deg) translateY(-4px)`;
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    });
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.dataset.active = 'false';
    el.style.transform = '';
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt relative ${className}`} style={style} {...rest}>
      {children}
      <span className="tilt__glare" aria-hidden />
    </div>
  );
};
