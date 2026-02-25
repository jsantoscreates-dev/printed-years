'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Mesh, Raycaster, Vector2, PerspectiveCamera } from 'three';
import { PosterMesh } from './PosterMesh';
import { CYLINDER } from '@/lib/constants';
import { useDragNavigation } from '@/hooks/useDragNavigation';
import postersData from '@/data/posters.json';
import type { PosterData } from '@/lib/types';

interface PosterPosition {
  id: string;
  position: [number, number, number];
  rotation: number;
  posterIndex: number;
  filename: string;
}

interface CylinderGridProps {
  onPosterClick?: (poster: PosterData) => void;
  isMobile?: boolean;
  isModalOpen?: boolean;
}

export function CylinderGrid({ onPosterClick, isMobile = false, isModalOpen = false }: CylinderGridProps) {
  const groupRef = useRef<Group>(null);
  const meshRefs = useRef<Map<string, Mesh>>(new Map());
  const { gl, camera } = useThree();

  // Raycaster for click detection
  const raycaster = useRef(new Raycaster());
  const mouse = useRef(new Vector2());

  // Navigation hook - disabled when modal is open
  const { update, state } = useDragNavigation(gl.domElement, isModalOpen);

  // Grid calculations - use fewer columns on mobile
  const {
    radius,
    posterHeight,
    gapY,
    tileRepeats,
  } = CYLINDER;

  const columns = isMobile ? CYLINDER.columnsMobile : CYLINDER.columns;
  const posters = postersData as PosterData[];
  const posterCount = posters.length;
  const rows = Math.ceil(posterCount / columns);
  const rowHeight = posterHeight + gapY;
  const tiledRows = rows * tileRepeats;
  const totalHeight = tiledRows * rowHeight;
  const halfHeight = totalHeight / 2;

  // Generate positions sorted by distance from center (y=0)
  // So center row loads first, then expands up/down
  const positions = useMemo(() => {
    const anglePerColumn = (2 * Math.PI) / columns;
    const items: PosterPosition[] = [];

    for (let tile = 0; tile < tileRepeats; tile++) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const posterIndex = (row * columns + col) % posterCount;
          const globalRow = tile * rows + row;

          // Stagger: odd rows offset by half column (use globalRow for consistent checkerboard)
          const angle = col * anglePerColumn + (globalRow % 2 === 1 ? anglePerColumn * 0.5 : 0);

          // Y position centered around 0
          const y = (globalRow - (tiledRows - 1) / 2) * rowHeight;

          // X and Z on cylinder surface
          const x = radius * Math.sin(angle);
          const z = radius * Math.cos(angle);

          // Rotation to face center (angle + PI to face inward)
          const rotationY = angle + Math.PI;

          items.push({
            id: `${tile}-${row}-${col}`,
            position: [x, y, z],
            rotation: rotationY,
            posterIndex,
            filename: posters[posterIndex].filename,
          });
        }
      }
    }

    // Sort: center row first, then expand outward; within each row, left to right
    // Use stable sort with id as final tie-breaker to prevent position swapping
    items.sort((a, b) => {
      const yDiff = Math.abs(a.position[1]) - Math.abs(b.position[1]);
      // If same row (similar Y), sort by angle (left to right)
      if (Math.abs(yDiff) < rowHeight * 0.5) {
        const rotDiff = a.rotation - b.rotation;
        // Use id as stable tie-breaker when rotations are equal
        if (Math.abs(rotDiff) < 0.0001) {
          return a.id.localeCompare(b.id);
        }
        return rotDiff;
      }
      return yDiff;
    });

    return items;
  }, [columns, radius, rows, tileRepeats, tiledRows, rowHeight, posterCount, posters]);

  // Ref callback for meshes
  const setMeshRef = useCallback((id: string, posterIndex: number, mesh: Mesh | null) => {
    if (mesh) {
      mesh.userData.posterIndex = posterIndex;
      meshRefs.current.set(id, mesh);
    } else {
      meshRefs.current.delete(id);
    }
  }, []);

  // Handle canvas click
  const handleClick = useCallback((event: MouseEvent) => {
    // Don't trigger click if we dragged
    if (state.current.dragMoved) return;

    // Calculate mouse position in normalized device coordinates
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);

    // Get all mesh objects
    const meshes = Array.from(meshRefs.current.values());
    const intersects = raycaster.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as Mesh;
      const posterIndex = hitMesh.userData.posterIndex as number;

      if (posterIndex !== undefined && onPosterClick) {
        onPosterClick(posters[posterIndex]);
      }
    }
  }, [camera, onPosterClick, posters, state]);

  // Setup click listener
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gl.domElement, handleClick]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (camera instanceof PerspectiveCamera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
      gl.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, gl]);

  // Animation loop
  useFrame(() => {
    const { angle, scrollY } = update();

    // Apply rotation to camera
    camera.rotation.set(0, -angle, 0);

    // Apply scroll to group
    if (groupRef.current) {
      groupRef.current.position.y = scrollY;

      // Tile wrapping - keep meshes in view (use while loops to handle large scrolls)
      meshRefs.current.forEach((mesh) => {
        let worldY = mesh.position.y + scrollY;

        while (worldY > halfHeight) {
          mesh.position.y -= totalHeight;
          worldY -= totalHeight;
        }
        while (worldY < -halfHeight) {
          mesh.position.y += totalHeight;
          worldY += totalHeight;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {positions.map((item) => (
        <PosterMesh
          key={item.id}
          ref={(mesh) => setMeshRef(item.id, item.posterIndex, mesh)}
          position={item.position}
          rotation={item.rotation}
          posterIndex={item.posterIndex}
          filename={item.filename}
        />
      ))}
    </group>
  );
}
