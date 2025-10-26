'use client';

import { Box, Paper, keyframes, Typography } from '@mui/material';
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

// Simple 2D rotation animation - clean and professional
const rollAnimation = keyframes`
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
`;

// Fade in animation for result
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

/**
 * Clean Dice Animation Component
 * Material Design 3 compliant with subtle animations
 */
export function DiceAnimation({ type, result, isRolling }: DiceAnimationProps) {
  const [displayNumber, setDisplayNumber] = useState<number | string>(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update display number when rolling stops
  useEffect(() => {
    if (!isRolling && result) {
      setIsAnimating(true);
      setDisplayNumber(result);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isRolling, result]);

  // Get dice color based on type (warm colors only)
  const getDiceConfig = () => {
    switch (type) {
      case 'NORMAL':
        return {
          gradient: 'linear-gradient(135deg, #FF8C00 0%, #FF6347 100%)', // Orange to Tomato
          label: 'Normal Dice',
          range: '1-6',
        };
      case 'GOLD':
        return {
          gradient: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)', // Gold to Orange
          label: 'Gold Dice',
          range: '1-12',
        };
      case 'DIAMOND':
        return {
          gradient: 'linear-gradient(135deg, #FF6347 0%, #DC143C 100%)', // Tomato to Crimson
          label: 'Diamond Dice',
          range: '1-20',
        };
      default:
        return {
          gradient: 'linear-gradient(135deg, #FF8C00 0%, #FF6347 100%)',
          label: 'Normal Dice',
          range: '1-6',
        };
    }
  };

  const config = getDiceConfig();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '280px',
        gap: 3,
      }}
    >
      {/* Dice Type Label */}
      <Typography variant="h6" fontWeight={600} color="text.secondary">
        {config.label} ({config.range})
      </Typography>

      {/* Dice Container */}
      <Paper
        elevation={isRolling ? 8 : 4}
        sx={{
          width: '160px',
          height: '160px',
          background: config.gradient,
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: isRolling ? `${rollAnimation} 1s ease-in-out infinite` : 'none',
          transition: 'all 0.3s ease',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            animation: isAnimating ? `${fadeIn} 0.3s ease-out` : 'none',
          }}
        >
          {isRolling ? '?' : displayNumber}
        </Typography>
      </Paper>
    </Box>
  );
}
