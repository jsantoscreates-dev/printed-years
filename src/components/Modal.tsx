'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoverTilt } from './HoverTilt';
import { MODAL, ANIMATION } from '@/lib/constants';
import { getTextureDataUrl } from '@/lib/textureCache';
import type { PosterData } from '@/lib/types';

interface ModalProps {
  poster: PosterData | null;
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const metadataVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: ANIMATION.metadataDelay,
      duration: 0.6,
      ease: ANIMATION.modalEasing,
    },
  },
  exit: { opacity: 0 },
};

export function Modal({ poster, isOpen, onClose, isMobile = false }: ModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Update image source when poster changes
  useEffect(() => {
    if (poster) {
      // Reset image immediately to avoid flash of previous poster
      setImageSrc(null);

      // Try full resolution first
      const fullUrl = `/posters/full/${poster.filename}`;
      const thumbUrl = `/posters/thumb/${poster.filename}`;
      const cachedDataUrl = getTextureDataUrl(poster.filename);

      // Create an image to test if full exists
      const img = new Image();
      img.onload = () => setImageSrc(fullUrl);
      img.onerror = () => {
        // Try thumb
        const thumbImg = new Image();
        thumbImg.onload = () => setImageSrc(thumbUrl);
        thumbImg.onerror = () => {
          // Use cached data URL from generated texture
          if (cachedDataUrl) {
            setImageSrc(cachedDataUrl);
          }
        };
        thumbImg.src = thumbUrl;
      };
      img.src = fullUrl;
    } else {
      setImageSrc(null);
    }
  }, [poster]);

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && poster && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
          style={{
            background: MODAL.backdropColor,
            backdropFilter: `blur(${MODAL.blurAmount})`,
            WebkitBackdropFilter: `blur(${MODAL.blurAmount})`,
            perspective: '1000px',
          }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            duration: ANIMATION.modalFadeDuration,
            ease: ANIMATION.modalEasing,
          }}
          onClick={handleBackdropClick}
        >
          {/* Close button */}
          <motion.button
            className="absolute flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            style={{
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 8L8 24M8 8L24 24"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>

          {/* Poster with tilt effect (disabled on mobile) */}
          {isMobile ? (
            <div
              className="relative overflow-hidden cursor-default flex items-center justify-center"
              style={{
                height: MODAL.heightMobile,
                maxWidth: MODAL.maxWidthMobile,
              }}
            >
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt={poster.title}
                  className="h-full w-auto object-contain"
                  style={{
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          ) : (
            <HoverTilt
              className="relative overflow-hidden cursor-default flex items-center justify-center"
              style={{
                height: '72vh',
                maxWidth: '80vw',
              }}
            >
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt={poster.title}
                  className="h-full w-auto object-contain"
                  style={{
                    pointerEvents: 'none',
                  }}
                />
              )}
            </HoverTilt>
          )}

          {/* Metadata */}
          <motion.div
            className="fixed text-center"
            style={{ bottom: '16px', left: '16px', right: '16px' }}
            variants={metadataVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2
              style={{
                fontSize: '24px',
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: '#FFFFFF',
                textTransform: 'lowercase',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {poster.title}
            </h2>
            <p
              style={{
                fontSize: '24px',
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: '#FFFFFF',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {poster.date}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
