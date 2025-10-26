'use client';

import { Box, Container } from '@mui/material';
import { DiceRoller } from '@/components/presale/DiceRoller';
import { Navigation } from '@/components/layout';

/**
 * Presale Dice Rolling Page
 * Route: /presale/dice
 *
 * Weekly dice rolling interface with 3D animation
 */
export default function PresaleDicePage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top navigation bar */}
      <Navigation activePage="presale" />

      {/* Main content area */}
      <Container maxWidth="lg">
        <Box
          sx={{
            pt: 12, // Account for fixed navbar
            pb: 8,
            px: {
              xs: 2,
              sm: 3,
            },
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #FFF4E6 0%, #FFD7A3 100%)', // Warm golden gradient
          }}
        >
          <DiceRoller />
        </Box>
      </Container>
    </Box>
  );
}
