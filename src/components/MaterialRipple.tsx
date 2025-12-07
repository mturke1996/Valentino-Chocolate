import { useEffect, useRef } from 'react';

interface MaterialRippleProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function MaterialRipple({ children, className = '', disabled = false }: MaterialRippleProps) {
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || !rippleRef.current) return;

    const element = rippleRef.current;
    let ripple: HTMLSpanElement | null = null;

    const createRipple = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple = document.createElement('span');
      ripple.className = 'material-ripple-effect';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      element.appendChild(ripple);

      setTimeout(() => {
        if (ripple) {
          ripple.classList.add('material-ripple-active');
        }
      }, 10);

      setTimeout(() => {
        if (ripple && ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 600);
    };

    element.addEventListener('mousedown', createRipple);

    return () => {
      element.removeEventListener('mousedown', createRipple);
    };
  }, [disabled]);

  return (
    <div ref={rippleRef} className={`material-ripple ${className}`} style={{ position: 'relative', overflow: 'hidden' }}>
      {children}
      <style>{`
        .material-ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(103, 80, 164, 0.12);
          transform: scale(0);
          pointer-events: none;
          transition: transform 0.6s cubic-bezier(0.2, 0, 0, 1),
                      opacity 0.6s cubic-bezier(0.2, 0, 0, 1);
          opacity: 0;
        }
        .material-ripple-effect.material-ripple-active {
          transform: scale(2);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}








