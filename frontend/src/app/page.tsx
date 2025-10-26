'use client';

import { Container, Typography, Box } from '@mui/material';
import { SwapCard } from '@/components/swap/SwapCard';
import { Navigation } from '@/components/layout/Navigation';

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top navigation bar */}
      <Navigation activePage="swap" />

      {/* Main content area (centered SwapCard) */}
      <Container
        maxWidth={false}
        sx={{
          pt: 12, // Account for fixed navbar
          pb: 8,
          px: {
            xs: 2, // Mobile: 16px padding
            sm: 0, // Desktop: no padding
          },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Huge whitespace (OlympusDAO style) */}
        <Box sx={{ height: { xs: 40, sm: 80 } }} />

        {/* SwapCard */}
        <SwapCard />

        {/* Huge whitespace (OlympusDAO style) */}
        <Box sx={{ height: { xs: 40, sm: 80 } }} />

        {/* Footer info */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 4,
            textAlign: 'center',
            fontSize: '0.875rem',
          }}
        >
          ve33 Decentralized Exchange • BSC Network
        </Typography>
      </Container>
    </Box>
  );
}
