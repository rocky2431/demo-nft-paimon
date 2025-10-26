'use client';

import { Box, keyframes } from '@mui/material';
import { useState, useEffect } from 'react';

/**
 * Dice Type: Normal (1-6), Gold (1-12), Diamond (1-20)
 */
export type DiceType = 'NORMAL' | 'GOLD' | 'DIAMOND';

interface DiceAnimationProps {
  type: DiceType;
  result?: number;
  isRolling: boolean;
}

const rollAnimation = keyframes`
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  25% {
    transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg);
  }
  50% {
    transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg);
  }
  75% {
    transform: rotateX(1080deg) rotateY(540deg) rotateZ(270deg);
  }
  100% {
    transform: rotateX(1440deg) rotateY(720deg) rotateZ(360deg);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 200, 0, 0.8), 0 0 40px rgba(255, 200, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 200, 0, 1), 0 0 80px rgba(255, 200, 0, 0.6);
  }
`;

const rainbowGlow = keyframes`
  0% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.4); }
  16% { box-shadow: 0 0 20px rgba(255, 127, 0, 0.8), 0 0 40px rgba(255, 127, 0, 0.4); }
  32% { box-shadow: 0 0 20px rgba(255, 255, 0, 0.8), 0 0 40px rgba(255, 255, 0, 0.4); }
  48% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.8), 0 0 40px rgba(0, 255, 0, 0.4); }
  64% { box-shadow: 0 0 20px rgba(0, 0, 255, 0.8), 0 0 40px rgba(0, 0, 255, 0.4); }
  80% { box-shadow: 0 0 20px rgba(139, 0, 255, 0.8), 0 0 40px rgba(139, 0, 255, 0.4); }
  100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.4); }
`;

/**
 * 3D Dice Animation Component
 * Uses CSS 3D transforms for realistic dice rolling effect
 */
export function DiceAnimation({ type, result, isRolling }: DiceAnimationProps) {
  const [displayNumber, setDisplayNumber] = useState(1);

  // Update display number when rolling stops
  useEffect(() => {
    if (!isRolling && result) {
      setDisplayNumber(result);
    }
  }, [isRolling, result]);

  // Get dice color based on type
  const getDiceColor = () => {
    switch (type) {
      case 'NORMAL':
        return 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)'; // Green
      case 'GOLD':
        return 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)'; // Gold
      case 'DIAMOND':
        return 'linear-gradient(135deg, #E1BEE7 0%, #9C27B0 100%)'; // Purple (will have rainbow glow)
      default:
        return 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)';
    }
  };

  // Get max value for dice type
  const getMaxValue = () => {
    switch (type) {
      case 'NORMAL':
        return 6;
      case 'GOLD':
        return 12;
      case 'DIAMOND':
        return 20;
      default:
        return 6;
    }
  };

  return (
    <Box
      sx={{
        perspective: '1000px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
      }}
    >
      <Box
        sx={{
          width: '150px',
          height: '150px',
          position: 'relative',
          transformStyle: 'preserve-3d',
          animation: isRolling ? `${rollAnimation} 1.5s ease-in-out infinite` : 'none',
          transition: 'transform 0.5s ease',
        }}
      >
        {/* Dice Face */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: getDiceColor(),
            borderRadius: '15px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '64px',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation:
              type === 'GOLD'
                ? `${pulseGlow} 2s ease-in-out infinite`
                : type === 'DIAMOND'
                  ? `${rainbowGlow} 3s linear infinite`
                  : 'none',
          }}
        >
          {isRolling ? '?' : displayNumber}
        </Box>
      </Box>

      {/* Dice Type Label */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -40,
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#666',
          textAlign: 'center',
        }}
      >
        {type} (1-{getMaxValue()})
      </Box>
    </Box>
  );
}
