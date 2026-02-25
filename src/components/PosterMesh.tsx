'use client';

import { forwardRef, useImperativeHandle, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, DoubleSide, MeshBasicMaterial, PlaneGeometry } from 'three';
import { CYLINDER, ANIMATION } from '@/lib/constants';
import { usePosterTexture } from '@/hooks/usePosterTexture';

interface PosterMeshProps {
  position: [number, number, number];
  rotation: number; // Y rotation in radians
  posterIndex: number;
  filename: string;
}

export const PosterMesh = forwardRef<Mesh, PosterMeshProps>(
  function PosterMesh({ position, rotation, posterIndex, filename }, ref) {
    const meshRef = useRef<Mesh>(null);
    const materialRef = useRef<MeshBasicMaterial>(null);
    const loadTimeRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => meshRef.current as Mesh);

    // Load texture (real image or generated placeholder)
    const textureResult = usePosterTexture(posterIndex, filename);

    // Mark load time when texture arrives
    useEffect(() => {
      if (textureResult && loadTimeRef.current === null) {
        loadTimeRef.current = performance.now();
      }
    }, [textureResult]);

    // Calculate geometry based on aspect ratio
    const geometry = useMemo(() => {
      if (!textureResult) return null;

      const height = CYLINDER.posterHeight;
      const width = height * textureResult.aspectRatio;

      return new PlaneGeometry(width, height);
    }, [textureResult]);

    // Fade-in animation with ease-in curve
    useFrame(() => {
      if (!materialRef.current || loadTimeRef.current === null) return;

      const material = materialRef.current;
      if (material.opacity >= 1) return;

      const elapsed = (performance.now() - loadTimeRef.current) / 1000;
      // Progress from 0 to 1
      const progress = Math.min(1, elapsed * ANIMATION.fadeInSpeed);
      // Apply ease-in curve (cubic): starts slow, accelerates
      const eased = progress * progress * progress;
      material.opacity = eased;
    });

    // Don't render until texture and geometry are ready
    if (!textureResult || !geometry) return null;

    return (
      <mesh
        ref={meshRef}
        position={position}
        rotation={[0, rotation, 0]}
        geometry={geometry}
      >
        <meshBasicMaterial
          ref={materialRef}
          map={textureResult.texture}
          side={DoubleSide}
          transparent
          opacity={0}
        />
      </mesh>
    );
  }
);
