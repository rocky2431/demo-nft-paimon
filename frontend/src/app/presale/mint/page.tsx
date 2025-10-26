'use client';

import { Box, Container } from '@mui/material';
import { MintInterface } from '@/components/presale/MintInterface';

/**
 * Presale Mint Page
 * Route: /presale/mint
 */
export default function PresaleMintPage() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          py: 8,
          background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE8CC 100%)', // Warm gradient
        }}
      >
        <MintInterface />
      </Box>
    </Container>
  );
}
