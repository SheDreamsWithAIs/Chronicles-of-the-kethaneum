'use client';
import React, { useEffect, useRef } from 'react';
import styles from './receiving-room.module.css';

export default function CosmicBackground({ variant = 'backstory', starCount = 150, particleCount = 40 }: {
  variant?: string; starCount?: number; particleCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let mounted = true;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const stars = Array.from({ length: starCount }).map(() => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.4, a: Math.random() * 0.8 + 0.2,
    }));
    function frame() {
      if (!mounted) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [starCount]);

  return (
    <div className={styles.cosmicBackground} aria-hidden>
      <div className={styles.nebulaLayer} />
      <canvas ref={canvasRef} className={styles.particleCanvas} />
    </div>
  );
}
