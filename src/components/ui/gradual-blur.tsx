'use client';

import React, { useMemo } from 'react';

interface GradualBlurProps {
  position?: 'top' | 'bottom';
  height?: string;
  layers?: number;
  maxBlur?: number;
  className?: string;
  tint?: string;
}

/**
 * GradualBlur: Multi-layered progressive optical glass blur veil with a very soft translucent fade.
 * Delivers pure optical backdrop blur refraction with zero harsh background opacity.
 */
export default function GradualBlur({
  position = 'top',
  height = '7.5rem',
  layers = 8,
  maxBlur = 28,
  className = '',
  tint = 'from-white/20 via-white/5 to-transparent',
}: GradualBlurProps) {
  const blurLayers = useMemo(() => {
    return Array.from({ length: layers }, (_, i) => {
      const fraction = (i + 1) / layers;
      const blurAmount = Math.max(0.75, Math.pow(fraction, 2.0) * maxBlur);
      const coveragePercent = Math.round((1 - (i / layers) * 0.8) * 100);
      const featherStart = Math.max(0, coveragePercent - 40);

      const maskGradient =
        position === 'top'
          ? `linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) ${featherStart}%, rgba(0, 0, 0, 0) ${coveragePercent}%)`
          : `linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) ${featherStart}%, rgba(0, 0, 0, 0) ${coveragePercent}%)`;

      return {
        id: i,
        blur: `${blurAmount.toFixed(1)}px`,
        mask: maskGradient,
      };
    });
  }, [layers, maxBlur, position]);

  return (
    <div
      aria-hidden="true"
      style={{ height }}
      className={`absolute ${
        position === 'top' ? 'top-0' : 'bottom-0'
      } inset-x-0 pointer-events-none z-20 overflow-hidden select-none will-change-transform ${className}`}
    >
      {/* Very Soft Translucent Tint Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${tint} pointer-events-none`} />

      {/* Progressive Multi-Tier Backdrop Glass Blur Layers */}
      {blurLayers.map((layer) => (
        <div
          key={layer.id}
          style={{
            backdropFilter: `blur(${layer.blur})`,
            WebkitBackdropFilter: `blur(${layer.blur})`,
            maskImage: layer.mask,
            WebkitMaskImage: layer.mask,
          }}
          className="absolute inset-0 pointer-events-none transform-gpu"
        />
      ))}
    </div>
  );
}
