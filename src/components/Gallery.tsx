'use client';

import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { CylinderGrid } from './CylinderGrid';
import { Modal } from './Modal';
import { Overlay } from './Overlay';
import { CYLINDER } from '@/lib/constants';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { PosterData } from '@/lib/types';

export function Gallery() {
  const [selectedPoster, setSelectedPoster] = useState<PosterData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const handlePosterClick = useCallback((poster: PosterData) => {
    setSelectedPoster(poster);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'hsla(0, 0%, 2%, 1)' }}>
      <Canvas
        camera={{
          position: [0, 0, 0],
          fov: CYLINDER.fov,
          near: 1,
          far: 3000,
        }}
        gl={{
          antialias: true,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050505']} />
        <CylinderGrid onPosterClick={handlePosterClick} isMobile={isMobile} />
      </Canvas>

      <Overlay isModalOpen={isModalOpen} />

      <Modal
        poster={selectedPoster}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isMobile={isMobile}
      />
    </div>
  );
}
