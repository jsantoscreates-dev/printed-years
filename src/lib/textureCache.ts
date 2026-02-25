// Global cache for texture data URLs (for modal fallback)
export const textureDataUrls = new Map<string, string>();

export function setTextureDataUrl(filename: string, dataUrl: string) {
  textureDataUrls.set(filename, dataUrl);
}

export function getTextureDataUrl(filename: string): string | undefined {
  return textureDataUrls.get(filename);
}
