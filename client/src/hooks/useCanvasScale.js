import { useState, useEffect } from 'react';

/**
 * Returns a CSS transform scale factor for the game canvas.
 * Scale is always <= 1 (never enlarges on desktop).
 * Re-computes on window resize and orientation change.
 * @param {number} canvasWidth - Logical canvas width (default 800)
 * @param {number} padding - Horizontal padding to subtract from viewport (default 32)
 */
export function useCanvasScale(canvasWidth = 800, padding = 32) {
  const [scale, setScale] = useState(
    () => Math.min(1, (window.innerWidth - padding) / canvasWidth)
  );

  useEffect(() => {
    const handleResize = () =>
      setScale(Math.min(1, (window.innerWidth - padding) / canvasWidth));
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [canvasWidth, padding]);

  return scale;
}
