'use client';

import { Container, Typography, Box } from '@mui/material';
import { VotingCard } from '@/components/voting/VotingCard';
import { Navigation } from '@/components/layout/Navigation';

export default function VotePage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top navigation bar */}
      <Navigation activePage="vote" />

      {/* Main content area (centered VotingCard) */}
      <Container
        maxWidth="lg"
        sx={{
          pt: 12, // Account for fixed navbar
          pb: 8,
          px: {
            xs: 2, // Mobile: 16px padding
            sm: 3, // Desktop: 24px padding
          },
          minHeight: '100vh',
        }}
      >
        {/* Huge whitespace (OlympusDAO style) */}
        <Box sx={{ height: { xs: 40, sm: 60 } }} />

        {/* VotingCard */}
        <VotingCard />

        {/* Huge whitespace (OlympusDAO style) */}
        <Box sx={{ height: { xs: 40, sm: 60 } }} />

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
          Governance Voting • Epoch-based Rewards Distribution
        </Typography>
      </Container>
    </Box>
  );
}
