'use client';

import { Box, Container } from '@mui/material';
import { DiceRoller } from '@/components/presale/DiceRoller';

/**
 * Presale Dice Rolling Page
 * Route: /presale/dice
 *
 * Weekly dice rolling interface with 3D animation
 */
export default function PresaleDicePage() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          py: 8,
          background: 'linear-gradient(135deg, #FFF4E6 0%, #FFD7A3 100%)', // Warm golden gradient
        }}
      >
        <DiceRoller />
      </Box>
    </Container>
  );
}
