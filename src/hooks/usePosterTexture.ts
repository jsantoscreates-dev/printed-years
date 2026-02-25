'use client';

import { useState, useEffect } from 'react';
import { Texture, TextureLoader, LinearFilter } from 'three';
import { generatePosterTexture } from '@/lib/generatePosterTexture';
import { setTextureDataUrl } from '@/lib/textureCache';

const textureLoader = new TextureLoader();

interface TextureResult {
  texture: Texture;
  aspectRatio: number; // width / height
}

const textureCache = new Map<string, TextureResult>();

// Parallel loading queue - loads multiple textures at once for faster startup
type LoadRequest = {
  filename: string;
  posterIndex: number;
  resolve: (result: TextureResult) => void;
};

const loadQueue: LoadRequest[] = [];
let activeLoads = 0;
const MAX_PARALLEL_LOADS = 6; // Load 6 textures at a time

function processQueue() {
  while (activeLoads < MAX_PARALLEL_LOADS && loadQueue.length > 0) {
    const request = loadQueue.shift()!;

    // Check cache first
    const cached = textureCache.get(request.filename);
    if (cached) {
      request.resolve(cached);
      continue;
    }

    activeLoads++;
    const thumbUrl = `/posters/thumb/${request.filename}`;

    textureLoader.load(
      thumbUrl,
      (loadedTexture) => {
        loadedTexture.minFilter = LinearFilter;
        loadedTexture.magFilter = LinearFilter;

        const image = loadedTexture.image as HTMLImageElement;
        const aspectRatio = image.width / image.height;

        // Store data URL for modal
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(image, 0, 0);
          setTextureDataUrl(request.filename, canvas.toDataURL('image/jpeg', 0.9));
        }

        const textureResult: TextureResult = {
          texture: loadedTexture,
          aspectRatio,
        };

        textureCache.set(request.filename, textureResult);
        request.resolve(textureResult);

        activeLoads--;
        processQueue();
      },
      undefined,
      () => {
        const generated = generatePosterTexture(request.posterIndex);
        const canvas = generated.image as HTMLCanvasElement;
        setTextureDataUrl(request.filename, canvas.toDataURL('image/jpeg', 0.9));

        const textureResult: TextureResult = {
          texture: generated,
          aspectRatio: 3 / 4,
        };

        textureCache.set(request.filename, textureResult);
        request.resolve(textureResult);

        activeLoads--;
        processQueue();
      }
    );
  }
}

function queueTextureLoad(filename: string, posterIndex: number): Promise<TextureResult> {
  // Check cache first
  const cached = textureCache.get(filename);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    // Check if already in queue
    const existing = loadQueue.find(r => r.filename === filename);
    if (existing) {
      const originalResolve = existing.resolve;
      existing.resolve = (result) => {
        originalResolve(result);
        resolve(result);
      };
      return;
    }

    loadQueue.push({ filename, posterIndex, resolve });
    processQueue();
  });
}

export function usePosterTexture(posterIndex: number, filename: string): TextureResult | null {
  const [result, setResult] = useState<TextureResult | null>(() => {
    return textureCache.get(filename) || null;
  });

  useEffect(() => {
    if (result) return;

    queueTextureLoad(filename, posterIndex).then(setResult);
  }, [posterIndex, filename, result]);

  return result;
}

// Reset queue (for hot reload)
export function resetTextureQueue() {
  loadQueue.length = 0;
  activeLoads = 0;
}
