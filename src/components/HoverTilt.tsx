'use client';

import { useRef, useEffect, useCallback, CSSProperties } from 'react';
import { MODAL } from '@/lib/constants';

interface HoverTiltProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function HoverTilt({ children, className = '', style }: HoverTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  // Current interpolated values
  const panX = useRef(0);
  const panY = useRef(0);
  const glareOpacity = useRef(0);

  // Target values
  const panTargetX = useRef(0);
  const panTargetY = useRef(0);
  const glareTargetOpacity = useRef(0);
  const glareX = useRef(50);
  const glareY = useRef(50);

  // Animation frame
  const rafId = useRef<number | null>(null);

  const animate = useCallback(() => {
    // Interpolate rotation - faster lerp for immediate response
    panX.current += (panTargetX.current - panX.current) * MODAL.tiltLerp;
    panY.current += (panTargetY.current - panY.current) * MODAL.tiltLerp;
    glareOpacity.current += (glareTargetOpacity.current - glareOpacity.current) * MODAL.glareLerp;

    // Apply transform
    if (containerRef.current) {
      containerRef.current.style.transform = `rotateX(${panX.current}deg) rotateY(${panY.current}deg)`;
    }

    // Apply glare
    if (glareRef.current) {
      glareRef.current.style.opacity = String(glareOpacity.current);
      glareRef.current.style.background = `radial-gradient(circle at ${glareX.current}% ${glareY.current}%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 55%)`;
    }

    // Continue animation - always keep running for smooth response
    rafId.current = requestAnimationFrame(animate);
  }, []);

  // Start animation when component mounts
  useEffect(() => {
    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [animate]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const ry = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    panTargetX.current = -ry * MODAL.tiltMax;
    panTargetY.current = rx * MODAL.tiltMax;

    // Glare follows mouse position
    glareX.current = (rx + 1) / 2 * 100;
    glareY.current = (ry + 1) / 2 * 100;
    glareTargetOpacity.current = MODAL.glareMaxOpacity;
  }, []);

  const handleMouseLeave = useCallback(() => {
    panTargetX.current = 0;
    panTargetY.current = 0;
    glareTargetOpacity.current = 0;
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {children}
      {/* Glare overlay */}
      <div
        ref={glareRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: 0,
        }}
      />
    </div>
  );
}
