'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useScreenSize } from '@/hooks/useScreenSize';

interface CosmicBackgroundProps {
  starCount?: number;
  particleCount?: number;
  variant?: 'title' | 'backstory' | 'book' | 'library' | 'puzzle';
  responsive?: boolean; // Enable responsive adjustments
}

export function CosmicBackground({ 
  starCount = 150, 
  particleCount = 40,
  variant = 'title',
  responsive = true
}: CosmicBackgroundProps) {
  const [isMounted, setIsMounted] = useState(false);
  const screenSize = useScreenSize();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Adjust counts based on screen size
  const adjustedStarCount = useMemo(() => {
    if (!responsive || !isMounted) return starCount;
    
    if (screenSize.isMobile) {
      return Math.floor(starCount * 0.4); // 40% on mobile
    } else if (screenSize.isTablet) {
      return Math.floor(starCount * 0.7); // 70% on tablet
    }
    return starCount; // Full count on desktop
  }, [starCount, responsive, screenSize.isMobile, screenSize.isTablet, isMounted]);

  const adjustedParticleCount = useMemo(() => {
    if (!responsive || !isMounted) return particleCount;
    
    if (screenSize.isMobile) {
      return Math.floor(particleCount * 0.5); // 50% on mobile
    } else if (screenSize.isTablet) {
      return Math.floor(particleCount * 0.75); // 75% on tablet
    }
    return particleCount; // Full count on desktop
  }, [particleCount, responsive, screenSize.isMobile, screenSize.isTablet, isMounted]);

  // Adjust animation speeds based on screen size (slower on smaller screens)
  const getAnimationDuration = useCallback((baseMin: number, baseMax: number) => {
    if (!responsive || !isMounted) {
      return Math.random() * (baseMax - baseMin) + baseMin;
    }
    
    if (screenSize.isMobile) {
      // Slower animations on mobile (150% of base duration)
      const min = baseMin * 1.5;
      const max = baseMax * 1.5;
      return Math.random() * (max - min) + min;
    } else if (screenSize.isTablet) {
      // Slightly slower on tablet (120% of base duration)
      const min = baseMin * 1.2;
      const max = baseMax * 1.2;
      return Math.random() * (max - min) + min;
    }
    return Math.random() * (baseMax - baseMin) + baseMin;
  }, [responsive, isMounted, screenSize.isMobile, screenSize.isTablet]);

  const stars = useMemo(() => {
    if (!isMounted) return [];
    
    return Array.from({ length: adjustedStarCount }, (_, i) => {
      const size = Math.random();
      let starSize = 'small';
      if (size > 0.7 && size < 0.9) starSize = 'medium';
      else if (size >= 0.9) starSize = 'large';
      
      const duration = getAnimationDuration(8, 16); // Base: 8-16 seconds for twinkle (slower for better performance)
      const delay = Math.random() * 6;
      
      return {
        id: i,
        size: starSize,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration,
        delay
      };
    });
  }, [adjustedStarCount, isMounted, getAnimationDuration]);

  const particles = useMemo(() => {
    if (!isMounted) return [];
    
    return Array.from({ length: adjustedParticleCount }, (_, i) => {
      const duration = getAnimationDuration(5, 13); // Base: 5-13 seconds for particles
      const delay = Math.random() * 10;
      
      return {
        id: i,
        left: Math.random() * 100,
        duration,
        delay
      };
    });
  }, [adjustedParticleCount, isMounted, getAnimationDuration]);

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return <div className={`cosmic-background bg-${variant}`} />;
  }

  return (
    <div className={`cosmic-background bg-${variant}`}>
      <div className="stars">
        {stars.map(star => (
          <div
            key={star.id}
            className={`star ${star.size}`}
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
      </div>
      <div className="cosmic-particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="cosmic-particle"
            style={{
              left: `${particle.left}%`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

