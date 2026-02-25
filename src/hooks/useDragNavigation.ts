'use client';

import { useRef, useEffect, useCallback } from 'react';
import { NAVIGATION, CYLINDER } from '@/lib/constants';

interface DragNavigationState {
  angle: number;
  scrollY: number;
  rotSpd: number;
  sSpd: number;
  isDragging: boolean;
  dragMoved: boolean;
  mouseX: number;
  mouseY: number;
}

export function useDragNavigation(canvas: HTMLCanvasElement | null, disabled: boolean = false) {
  const state = useRef<DragNavigationState>({
    angle: 0,
    scrollY: 0,
    rotSpd: 0,
    sSpd: 0,
    isDragging: false,
    dragMoved: false,
    mouseX: 0.5,
    mouseY: 0.5,
  });

  const dragStart = useRef({ x: 0, y: 0 });

  // Calculate total height for wrapping
  const rows = Math.ceil(30 / CYLINDER.columns); // 30 posters
  const rowHeight = CYLINDER.posterHeight + CYLINDER.gapY;
  const totalHeight = rows * rowHeight;

  // Mouse down - start drag
  const handleMouseDown = useCallback((e: MouseEvent) => {
    state.current.isDragging = true;
    state.current.dragMoved = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (canvas) canvas.style.cursor = 'grabbing';
  }, [canvas]);

  // Mouse move - drag and track position for edge drift
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Always track mouse position for edge drift
    state.current.mouseX = e.clientX / window.innerWidth;
    state.current.mouseY = e.clientY / window.innerHeight;

    if (!state.current.isDragging) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    // Check if this is a drag (not a click)
    if (Math.abs(deltaX) > NAVIGATION.dragThreshold || Math.abs(deltaY) > NAVIGATION.dragThreshold) {
      state.current.dragMoved = true;
    }

    // Apply directly to position
    state.current.angle -= deltaX * NAVIGATION.dragSensitivityX;
    state.current.scrollY += deltaY * NAVIGATION.dragSensitivityY;

    // Store velocity for momentum on release
    state.current.rotSpd = -deltaX * NAVIGATION.momentumX;
    state.current.sSpd = deltaY * NAVIGATION.momentumY;

    // Update drag start for next frame
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Mouse up - end drag
  const handleMouseUp = useCallback(() => {
    state.current.isDragging = false;
    if (canvas) canvas.style.cursor = 'grab';
  }, [canvas]);

  // Wheel scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    state.current.sSpd += e.deltaY * NAVIGATION.wheelSpeed;
  }, []);

  // Touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    state.current.isDragging = true;
    state.current.dragMoved = false;
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  // Touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (!state.current.isDragging) return;

    const deltaX = e.touches[0].clientX - dragStart.current.x;
    const deltaY = e.touches[0].clientY - dragStart.current.y;

    if (Math.abs(deltaX) > NAVIGATION.dragThreshold || Math.abs(deltaY) > NAVIGATION.dragThreshold) {
      state.current.dragMoved = true;
    }

    state.current.angle -= deltaX * NAVIGATION.dragSensitivityX;
    state.current.scrollY += deltaY * NAVIGATION.dragSensitivityY;
    state.current.rotSpd = -deltaX * NAVIGATION.momentumX;
    state.current.sSpd = deltaY * NAVIGATION.momentumY;

    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  // Touch end
  const handleTouchEnd = useCallback(() => {
    state.current.isDragging = false;
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!canvas) return;

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';

    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel, { passive: true });

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvas, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Update function called in useFrame
  const update = useCallback(() => {
    const s = state.current;

    // When disabled (modal open), stop all movement and momentum
    if (disabled) {
      s.rotSpd = 0;
      s.sSpd = 0;
      s.isDragging = false;
      return {
        angle: s.angle,
        scrollY: s.scrollY,
        isDragging: false,
        dragMoved: false,
      };
    }

    if (!s.isDragging) {
      // Normalized mouse position (-1 to 1)
      const nx = (s.mouseX - 0.5) * 2;
      const ny = (s.mouseY - 0.5) * 2;
      const ax = Math.abs(nx);
      const ay = Math.abs(ny);

      // Subtle edge drift when mouse is near edges
      if (ax > NAVIGATION.edgeZone) {
        const f = (ax - NAVIGATION.edgeZone) / (1 - NAVIGATION.edgeZone);
        s.rotSpd += Math.sign(nx) * f * NAVIGATION.edgeDriftSpeed * 0.016;
      }
      if (ay > NAVIGATION.edgeZone) {
        const f = (ay - NAVIGATION.edgeZone) / (1 - NAVIGATION.edgeZone);
        s.sSpd += Math.sign(ny) * f * NAVIGATION.edgeDriftSpeed * 0.5;
      }

      // Apply momentum with damping
      s.rotSpd *= NAVIGATION.damping;
      s.sSpd *= NAVIGATION.damping;
      s.angle += s.rotSpd * 0.04;
      s.scrollY += s.sSpd * 0.5;
    }

    // Wrap scrollY for infinite vertical scroll
    s.scrollY = ((s.scrollY % totalHeight) + totalHeight) % totalHeight;

    return {
      angle: s.angle,
      scrollY: s.scrollY,
      isDragging: s.isDragging,
      dragMoved: s.dragMoved,
    };
  }, [totalHeight, disabled]);

  const resetDragMoved = useCallback(() => {
    state.current.dragMoved = false;
  }, []);

  return { state, update, resetDragMoved };
}
