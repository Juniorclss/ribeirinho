/**
 * WIDGETS GRÁFICOS 2D/2.5D HD: RETRATOS FOTORREALISTAS DIGITAIS & ÍCONES 2D PINTADOS À MÃO
 */

import React, { useEffect, useRef } from 'react';
import {
  drawCharacterPortrait32Bit,
  drawHandPaintedHudIcon2D,
  drawPixelIcon,
  drawProtagonistPortrait
} from '../game/pixelArtEngine';

export const PixelPortraitCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 140 * dpr;
    c.height = 140 * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawProtagonistPortrait(ctx, 140, 140);
  }, []);

  return (
    <canvas
      ref={ref}
      width={140}
      height={140}
      className={className}
      aria-label="Retrato Fotorrealista de Cauã"
    />
  );
};

export const PixelNpcPortraitCanvas: React.FC<{
  shirtColor: string;
  hatColor: string | null;
  hairColor: string;
  className?: string;
  label?: string;
}> = ({ shirtColor, hatColor, hairColor, className = '', label = 'Retrato do Personagem' }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 140 * dpr;
    c.height = 140 * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawCharacterPortrait32Bit(ctx, 140, 140, shirtColor, hatColor, hairColor, false);
  }, [shirtColor, hatColor, hairColor]);

  return (
    <canvas
      ref={ref}
      width={140}
      height={140}
      className={className}
      aria-label={label}
    />
  );
};

export const PixelIconCanvas: React.FC<{
  kind: string;
  size?: number;
  className?: string;
  isSwaying?: boolean;
}> = ({ kind, size = 24, className = '', isSwaying = false }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 48 * dpr;
    c.height = 48 * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawPixelIcon(ctx, kind, 48, 48);
  }, [kind]);

  return (
    <canvas
      ref={ref}
      width={48}
      height={48}
      style={{ width: size, height: size }}
      className={`${isSwaying ? 'animate-crop-rain-sway' : ''} ${className}`.trim()}
    />
  );
};

export type HudIconType =
  | 'enxada'
  | 'semente'
  | 'regador'
  | 'colheita'
  | 'vara_pesca'
  | 'machado_limpeza'
  | 'mochila'
  | 'feira'
  | 'diario'
  | 'opcoes'
  | 'agir'
  | 'camera'
  | 'sol'
  | 'chuva'
  | 'nublado'
  | 'som_ligado'
  | 'som_mudo';

/**
 * Ícones 2D Ilustrados à Mão para o HUD (sem visual chapado de Canva)
 */
export const ModernHudSvgIcon: React.FC<{
  name: HudIconType;
  size?: number;
  className?: string;
}> = ({ name, size = 22, className = '' }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 48 * dpr;
    c.height = 48 * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawHandPaintedHudIcon2D(ctx, name, 48, 48);
  }, [name]);

  return (
    <canvas
      ref={ref}
      width={48}
      height={48}
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 ${className}`.trim()}
      aria-hidden="true"
    />
  );
};


