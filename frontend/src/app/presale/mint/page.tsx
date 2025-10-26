'use client';

import { Box, Container } from '@mui/material';
import { MintInterface } from '@/components/presale/MintInterface';
import { Navigation } from '@/components/layout';

/**
 * Presale Mint Page
 * Route: /presale/mint
 */
export default function PresaleMintPage() {
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
            background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE8CC 100%)', // Warm gradient
          }}
        >
          {/* Huge whitespace (OlympusDAO style) */}
          <Box sx={{ height: { xs: 40, sm: 60 } }} />

          {/* Spacer to match VoteTabs/LiquidityTabs height for consistent card position */}
          <Box sx={{ height: 80, mb: 0 }} />

          <MintInterface />
        </Box>
      </Container>
    </Box>
  );
}
