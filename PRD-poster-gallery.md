# PRD — Cylindrical Poster Gallery
## jsantoscreates

**Version:** 1.0
**Date:** February 2026
**Status:** Ready for implementation

---

## 1. Overview

An experimental art/design portfolio website that displays posters on the interior surface of a 3D cylinder. The user sits at the center and navigates by dragging (primary) and scrolling. Clicking a poster opens an expanded view with a 3D tilt hover effect. The site is a creative showcase — function follows form.

**Live URL (future):** Custom domain (TBD), initially deployed at `jsantoscreates.vercel.app`

---

## 2. Goals & Non-Goals

### Goals
- Create an immersive, experimental gallery experience that stands out
- Smooth, polished 60fps interactions on modern hardware (MacBook/PC)
- Easy to update: drop images + edit a JSON file
- Clean, minimal UI that doesn't compete with the work

### Non-Goals
- SEO optimization (link will be shared directly)
- Analytics tracking
- CMS or admin panel
- About page (deferred)
- Dark mode
- E-commerce or contact forms

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Best Vercel integration, SSG for static site, good TS support |
| Language | **TypeScript** | Type safety for 3D math and data |
| 3D | **React Three Fiber (R3F) + @react-three/drei** | React-native 3D, declarative, great ecosystem |
| Animation (DOM) | **Framer Motion** | Modal transitions, 3D tilt, UI animations |
| Styling | **Tailwind CSS** | Utility-first, fast iteration |
| Icons | **shadcn/ui** (lucide-react icons) | Consistent icon set, tree-shakeable |
| Hosting | **Vercel** | Zero-config Next.js deployment, CDN, preview deploys |

### Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "@react-three/fiber": "^8.0.0",
    "@react-three/drei": "^9.0.0",
    "three": "^0.160.0",
    "framer-motion": "^11.0.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/three": "^0.160.0"
  }
}
```

---

## 4. Visual Design

### Theme
- **Background:** `#E7E7E7` (solid light grey, no gradients)
- **Typography:** Helvetica Neue → Helvetica → Arial (system stack)
- **Corners:** Sharp everywhere (no border-radius on posters)
- **Mood:** Clean, editorial, gallery-like. Let the work speak.

### Identity (Fixed HTML Overlay)
- **Top center:** "jsantoscreates" — `15px`, weight 500, tracking 0.08em, `rgba(26,26,26,0.85)`, link to home
- **Footer center:** "designed & developed by jsantoscreates © 2024" — `11px`, weight 400, `rgba(26,26,26,0.35)`
- **Social links:** Instagram + LinkedIn icons (lucide-react), positioned top-right, `opacity 0.5 → 1` on hover

### Navigation Hint
- On first load: "drag to explore · scroll to navigate vertically" — `11px`, `rgba(26,26,26,0.25)`, centered above footer
- Fades out (`opacity 0`, `transition 1.2s ease`) on first mouse movement
- Never shown again during session

---

## 5. 3D Scene — Cylinder Architecture

### Camera
- Position: `[0, 0, 0]` (center of cylinder)
- FOV: `38°`
- Near/far: `1 / 3000`

### Cylinder Configuration
- **Radius:** `350` units
- **Columns:** `12` posters per ring
- **Rows:** `ceil(posterCount / columns)` — currently `3` rows for 30 posters
- **Poster size:** `90 × 122` units (width × height)
- **Vertical gap:** `28` units between rows
- **Layout:** Staggered/brick — odd rows offset by `anglePerColumn * 0.5`
- **Angle per column:** `2π / 12 = 0.5236 rad`

### Poster Mesh
- Geometry: `PlaneGeometry(90, 122)`
- Material: `MeshBasicMaterial`, `side: DoubleSide`, `transparent: true`
- Orientation: Each poster uses `lookAt(0, y, 0)` to face center
- Texture: Loaded from optimized JPGs, applied as map

### Infinite Scroll (Vertical Tiling)
- Posters are tiled `11×` vertically (11 copies of the full grid)
- Each frame: check if mesh world Y exceeds `±(tiledRows × rowHeight) / 2`, wrap to opposite side
- This creates seamless infinite vertical scroll
- Horizontal is naturally infinite (360° rotation)

### Grid Position Algorithm

```typescript
// cylinderGrid.ts
const anglePerCol = (2 * Math.PI) / COLS;
const rowHeight = POSTER_HEIGHT + GAP_Y;

for (let tile = 0; tile < TILES; tile++) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const posterIndex = (row * COLS + col) % POSTER_COUNT;
      const globalRow = tile * ROWS + row;

      // Stagger: odd rows offset by half column
      const angle = col * anglePerCol + (row % 2 === 1 ? anglePerCol * 0.5 : 0);
      const y = (globalRow - (tiledRows - 1) / 2) * rowHeight;
      const x = RADIUS * Math.sin(angle);
      const z = RADIUS * Math.cos(angle);

      // Create mesh, position, lookAt(0, y, 0)
    }
  }
}
```

---

## 6. Navigation System

### Primary: Click-and-Drag

The main interaction model. User clicks and drags on the canvas to rotate horizontally and scroll vertically. Feels like manipulating a physical object.

**Mouse Events:**
- `mousedown` → start drag, set cursor to `grabbing`, record start position
- `mousemove` (while dragging) → calculate delta, apply directly to angle and scrollY
- `mouseup` → stop drag, store last velocity for momentum, cursor back to `grab`

**Sensitivity (tuned for smoothness):**
- Horizontal: `angle -= deltaX * 0.0012`
- Vertical: `scrollY += deltaY * 0.15`

**Momentum on release:**
- `rotSpd = -deltaX * 0.0008`
- `sSpd = deltaY * 0.12`
- Damping: `0.975` per frame (long, gradual deceleration)
- Applied in `useFrame` loop only when not dragging

**Click vs Drag detection:**
- Track `dragMoved` flag, set to `true` if delta exceeds `4px` in either axis
- Click handler only fires if `dragMoved === false`

### Secondary: Scroll Wheel (Vertical)
- `wheel` event: `sSpd += deltaY * 0.004`
- Same momentum/damping system as drag

### Secondary: Edge Drift (Decorative)
- When mouse is within 15% of screen edge and NOT dragging
- Very subtle drift: `DRIFT_SPD = 0.08`
- Arrow indicators `‹` `›` appear at 15% opacity near edges
- Purpose: ambient hint that there's more content, not a navigation mechanism

### Touch (Mobile)
- Same drag model as desktop
- `touchmove` deltas applied directly: `angle -= dx * 0.0012`, `scrollY += dy * 0.15`
- Momentum on `touchend`: same velocity storage and damping
- Free movement in both axes simultaneously (no axis lock)
- `touch-action: none` on canvas

### Cursor States
- Default (no drag, no poster hover): `grab`
- Dragging: `grabbing`
- Hovering over poster (not dragging): `pointer`

### Render Loop (useFrame)

```typescript
// Pseudocode for the main loop
useFrame(() => {
  if (!isDragging) {
    // Edge drift (very subtle)
    if (mouseNearEdge) {
      rotSpd += edgeDriftForce;
    }

    // Apply momentum + damping
    rotSpd *= 0.975;
    sSpd *= 0.975;
    angle += rotSpd * 0.04;
    scrollY += sSpd * 0.5;
  }

  // Wrap scrollY for infinite loop
  scrollY = ((scrollY % TOTAL_H) + TOTAL_H) % TOTAL_H;

  // Apply to camera and group
  camera.rotation.y = -angle;
  group.position.y = scrollY;

  // Tile wrapping
  meshes.forEach(mesh => wrapVertically(mesh));
});
```

---

## 7. Poster Loading & Fade-In

No loading screen. Posters materialize progressively.

### Strategy
- Load thumbnail textures (~512px wide) for 3D scene
- Stagger fade-in: each poster `opacity 0 → 1`, delayed by `index * 0.07s`, speed `1.2× per second`
- Use `useTexture` or `TextureLoader` with `onLoad` callback
- Material is `transparent: true`, opacity animated in `useFrame` via `lerp`

### Image Pipeline
- Source images in `/public/posters/`
- Build script generates thumbnails (`512px` width) for 3D scene
- Full resolution served in modal (native size or max `2048px`)

---

## 8. Modal — Poster Detail View

### Trigger
- Click on poster mesh (via R3F `onClick` / raycaster)
- Only fires if `dragMoved === false`

### Appearance
- Backdrop: `rgba(0,0,0,0.45)` + `backdrop-filter: blur(24px)`
- Poster: `72vh` height, `max-width: 80vw`, `aspect-ratio: 3/4`
- No border-radius, no box-shadow
- Fade-in: `opacity 0 → 1`, `0.5s`, `cubic-bezier(0.25, 0.1, 0.25, 1)`
- Metadata below poster: title (`18px`, weight 400, white) + date (`13px`, weight 300, `rgba(255,255,255,0.6)`), fade in with `0.25s` delay

### 3D Tilt Hover Effect (Key Feature)

**Reference:** See attached video `Gravação_de_Ecrã_2026-02-20_160857.mp4` — card tilt effect from a travel ticket gallery.

The poster responds to mouse position **only when hovering over the poster element** (not full screen). On mouse leave, smoothly returns to neutral.

**Implementation (Framer Motion or manual in RAF):**

```typescript
// State
let panTargetX = 0, panTargetY = 0;  // target rotation
let panX = 0, panY = 0;              // current (interpolated)
let glareX = 50, glareY = 50;        // glare position %
let glareOpacity = 0;

// On mousemove over poster:
const rx = ((mouseX - rect.left) / rect.width - 0.5) * 2;   // -1 to 1
const ry = ((mouseY - rect.top) / rect.height - 0.5) * 2;
panTargetX = -ry * 14;   // rotateX (tilt up/down), 14° max
panTargetY = rx * 14;    // rotateY (tilt left/right)
glareX = (rx + 1) / 2 * 100;   // glare follows mouse
glareY = (ry + 1) / 2 * 100;
glareOpacity = 0.2;

// On mouseleave:
panTargetX = 0; panTargetY = 0; glareOpacity = 0;

// In animation loop (smooth interpolation):
panX += (panTargetX - panX) * 0.045;
panY += (panTargetY - panY) * 0.045;

// Apply:
poster.style.transform = `rotateX(${panX}deg) rotateY(${panY}deg)`;
```

**Key properties:**
- Container: `perspective: 1000px`
- Poster: `transform-style: preserve-3d`, `will-change: transform`
- Max tilt: `±14°`
- Interpolation factor: `0.045` (silky smooth lag)
- Glare overlay: `radial-gradient` that follows mouse, `opacity 0.2` max

### Close
- Click outside poster (on backdrop)
- Press `Escape`
- Reverse fade-out animation
- Reset all tilt/glare values on close

---

## 9. File Structure

```
poster-gallery/
├── public/
│   └── posters/
│       ├── thumb/           # 512px thumbnails (auto-generated)
│       │   ├── 01.jpg
│       │   └── ...
│       └── full/            # Full resolution
│           ├── 01.jpg
│           └── ...
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout, fonts, metadata
│   │   ├── page.tsx         # Home — renders Gallery
│   │   └── globals.css      # Tailwind base + custom vars
│   ├── components/
│   │   ├── Gallery.tsx      # Main R3F Canvas + scene
│   │   ├── CylinderGrid.tsx # 3D poster meshes, positioning
│   │   ├── PosterMesh.tsx   # Individual poster plane
│   │   ├── Overlay.tsx      # Fixed HTML layer (identity, hints, arrows)
│   │   ├── Modal.tsx        # Poster detail modal (Framer Motion)
│   │   └── HoverTilt.tsx    # 3D tilt effect component
│   ├── hooks/
│   │   ├── useDragNavigation.ts    # Mouse/touch drag + momentum
│   │   ├── useEdgeDrift.ts         # Subtle edge drift
│   │   ├── useCylinderState.ts     # angle, scrollY, speeds (Zustand or useRef)
│   │   └── useTileWrap.ts          # Vertical tiling logic
│   ├── lib/
│   │   ├── cylinderGrid.ts  # Grid math: positions, angles, stagger
│   │   └── constants.ts     # All magic numbers in one place
│   └── data/
│       └── posters.json     # Poster metadata
├── scripts/
│   └── generate-thumbnails.js  # Sharp.js script to create /thumb/ from /full/
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── package.json
```

---

## 10. Data Model

### `/src/data/posters.json`

```json
[
  {
    "id": "01",
    "filename": "01.jpg",
    "title": "Meridian",
    "date": "2024"
  },
  {
    "id": "02",
    "filename": "02.jpg",
    "title": "Nocturne",
    "date": "2024"
  }
]
```

### Content Management Workflow
1. Drop new JPGs into `/public/posters/full/`
2. Run `node scripts/generate-thumbnails.js` (creates 512px thumbs)
3. Add entry to `posters.json`
4. `git push` → Vercel auto-deploys

---

## 11. Constants

All tunable values in one file for easy adjustment:

```typescript
// src/lib/constants.ts
export const CYLINDER = {
  radius: 350,
  columns: 12,
  fov: 38,
  posterWidth: 90,
  posterHeight: 122,
  gapY: 28,
  tileRepeats: 11,
} as const;

export const NAVIGATION = {
  dragSensitivityX: 0.0012,
  dragSensitivityY: 0.15,
  momentumX: 0.0008,
  momentumY: 0.12,
  damping: 0.975,
  wheelSpeed: 0.004,
  edgeZone: 0.85,
  edgeDriftSpeed: 0.08,
  dragThreshold: 4,       // px before drag vs click
} as const;

export const MODAL = {
  tiltMax: 14,             // degrees
  tiltLerp: 0.045,
  glareMaxOpacity: 0.2,
  backdropColor: 'rgba(0,0,0,0.45)',
  blurAmount: '24px',
} as const;

export const ANIMATION = {
  fadeInDelay: 0.07,       // seconds between poster fade-ins
  fadeInSpeed: 1.2,        // opacity per second
  modalFadeDuration: 0.5,  // seconds
  modalEasing: [0.25, 0.1, 0.25, 1],
  metadataDelay: 0.25,     // seconds after modal opens
} as const;

export const THEME = {
  background: '#E7E7E7',
  textPrimary: 'rgba(26,26,26,0.85)',
  textSecondary: 'rgba(26,26,26,0.5)',
  textMuted: 'rgba(26,26,26,0.35)',
  textHint: 'rgba(26,26,26,0.25)',
} as const;
```

---

## 12. Component Specifications

### `Gallery.tsx`
- Renders `<Canvas>` with camera config
- Renders `<CylinderGrid>` inside Canvas
- Renders `<Overlay>` and `<Modal>` as HTML siblings (outside Canvas)
- Manages shared state: `selectedPoster`, `modalOpen`

### `CylinderGrid.tsx`
- Uses `useCylinderState` hook for angle/scroll
- Uses `useDragNavigation` hook for input handling
- Generates poster meshes from `posters.json` using grid algorithm
- Handles tile wrapping in `useFrame`
- Passes click events up (with `dragMoved` guard)

### `PosterMesh.tsx`
- Single poster plane
- Loads texture with `useTexture` (drei)
- Manages own fade-in opacity
- Props: `position`, `rotation`, `texture`, `posterData`, `onClick`

### `Modal.tsx` (Framer Motion)
- `AnimatePresence` for enter/exit
- Backdrop: `motion.div` with opacity animation
- Poster container: `motion.div` with `perspective: 1000px`
- Contains `<HoverTilt>` component
- Shows title + date with staggered delay
- Close on backdrop click or Escape

### `HoverTilt.tsx`
- Wraps poster image in modal
- Tracks mouse position relative to element bounds
- Calculates `rotateX`, `rotateY` targets
- Interpolates in `requestAnimationFrame` loop
- Renders glare overlay as pseudo-element or child div
- Returns to neutral on `mouseleave`

### `Overlay.tsx`
- Fixed position HTML layer
- Logo (top center), footer (bottom center)
- Social icons (top right): Instagram, LinkedIn from lucide-react
- Navigation hint (above footer, fades out)
- Edge arrows `‹` `›` (appear/disappear based on mouse position)

---

## 13. Animation Division

| What | Engine | Why |
|---|---|---|
| Cylinder rotation | R3F `useFrame` | Must be in 3D render loop |
| Vertical scroll | R3F `useFrame` | Same |
| Tile wrapping | R3F `useFrame` | Same |
| Poster texture fade-in | R3F `useFrame` (material.opacity lerp) | Tied to texture load |
| Drag momentum/damping | R3F `useFrame` | Needs per-frame update |
| Modal backdrop fade | Framer Motion | DOM element |
| Modal metadata fade | Framer Motion | DOM, needs delay |
| 3D tilt hover | `requestAnimationFrame` or Framer Motion `useMotionValue` | DOM transform, needs interpolation |
| Glare effect | CSS + JS position update | Follows mouse |
| Edge arrows fade | CSS transition | Simple opacity |
| Identity hover | CSS transition | Simple opacity |
| Navigation hint fade | CSS transition | One-time fade out |

### Easing Standard
All CSS transitions use: `cubic-bezier(0.25, 0.1, 0.25, 1)` — a soft ease-out that matches the overall feel. Duration typically `0.5–0.6s` for UI elements.

---

## 14. Performance

### Targets
- 60fps on MacBook Pro / modern PC
- Acceptable degradation on mid-range laptops
- Mobile: functional but secondary priority

### Optimizations
- Thumbnail textures (512px) for 3D scene — full res only in modal
- `THREE.LinearFilter` on textures (no mipmaps needed)
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` — cap at 2x
- `MeshBasicMaterial` — no lighting calculations
- Frustum culling (built into R3F)
- `will-change: transform` on modal poster only during animation
- No shadows, no post-processing
- Dispose textures when component unmounts

### Bundle
- Tree-shake Three.js (R3F handles this)
- Dynamic import for modal (not needed on initial load)
- Next.js automatic code splitting

---

## 15. Mobile Considerations

Desktop-first, but mobile should work.

### Touch Navigation
- Same drag model as desktop mouse
- Free movement in both axes (no axis lock)
- Momentum on touch release
- `touch-action: none` on canvas element

### Layout Adjustments
- Consider reducing `columns` on small screens (e.g., 8 instead of 12)
- Consider increasing poster size slightly for tap targets
- Modal: `90vh` height on mobile, full-width
- 3D tilt disabled on touch (no hover) — static poster in modal

### Detection
```typescript
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
```

---

## 16. Implementation Phases

### Phase 1 — Scene Foundation
- [ ] Next.js project setup with TypeScript + Tailwind
- [ ] R3F Canvas with camera configuration
- [ ] Cylinder grid with placeholder colored planes
- [ ] Verify 2 rows visible, staggered layout, curvature
- **Validate:** Can see poster grid on cylinder interior

### Phase 2 — Navigation (CORE — spend time here)
- [ ] `useDragNavigation` hook: mousedown/move/up + touch
- [ ] Direct position update during drag
- [ ] Momentum on release with damping
- [ ] Scroll wheel for vertical
- [ ] Subtle edge drift
- [ ] Click vs drag detection
- [ ] Cursor states (grab/grabbing/pointer)
- [ ] Vertical tile wrapping
- **Validate:** Smooth, responsive navigation. Can drag to explore. Momentum feels natural.

### Phase 3 — Textures & Content
- [ ] Load poster images from `/public/posters/`
- [ ] Thumbnail generation script
- [ ] Progressive fade-in animation
- [ ] `posters.json` data loading
- **Validate:** Real images showing, fade-in looks polished

### Phase 4 — Modal & Tilt
- [ ] Raycaster click detection
- [ ] Modal with Framer Motion (backdrop + poster)
- [ ] 3D tilt hover effect on poster
- [ ] Glare overlay
- [ ] Title + date with delayed fade-in
- [ ] Close: Esc + backdrop click
- **Validate:** Tilt feels like the reference video. Smooth open/close.

### Phase 5 — UI & Polish
- [ ] Identity overlay (logo, footer, socials)
- [ ] Navigation hint (fade on first move)
- [ ] Edge arrow indicators
- [ ] All transitions at consistent easing
- [ ] Test with 30 real poster images
- **Validate:** Cohesive visual experience

### Phase 6 — Mobile & Deploy
- [ ] Touch drag navigation
- [ ] Responsive adjustments
- [ ] Performance profiling
- [ ] Vercel deployment
- [ ] Custom domain (later)
- **Validate:** Works on mobile Safari + Chrome. 60fps on desktop.

---

## 17. Prototype Reference

A working HTML prototype exists at `poster-gallery-v3.html` (attached). It contains the complete interaction model implemented in vanilla Three.js. **Use this as the ground truth for how interactions should feel**, then reimplement properly in R3F + Framer Motion.

Key behaviors to preserve from prototype:
- Drag sensitivity and momentum values
- Staggered grid layout
- 3D tilt (14° max, 0.045 lerp)
- Fade-in stagger timing
- Edge drift subtlety
- Modal backdrop blur

---

## 18. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 3D performance on low-end devices | Poor FPS, bad UX | Use thumbnails, basic materials, cap pixel ratio. Accept degradation on old hardware. |
| Drag + click conflict | Accidental opens/misses | 4px threshold for drag detection. Tested in prototype. |
| Texture memory with 30+ posters × 11 tiles | High VRAM usage | Share texture instances across tiles (same posterIndex = same texture). Only 30 unique textures loaded. |
| Mixed aspect ratio posters | Grid looks uneven | Use consistent PlaneGeometry size. Poster images are object-fit: cover in texture. Some cropping acceptable. |
| Mobile 3D performance | Stuttering | Reduce columns, tile count on mobile. Disable edge drift. |

---

## 19. Future Considerations (Out of Scope)
- About page with bio/CV
- Poster categories/filtering
- Dark mode toggle
- Sound design / ambient audio
- Poster detail page (multi-image project view)
- CMS integration (Sanity, Contentful)
- Analytics
- Blog/journal section
