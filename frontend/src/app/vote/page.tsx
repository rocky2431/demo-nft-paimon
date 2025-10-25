'use client';

import { Container, Typography, Box, Stack } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { VotingCard } from '@/components/voting/VotingCard';

export default function VotePage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top navigation bar (OlympusDAO style) */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'background.paper',
          borderBottom: 'none',
          boxShadow: 'inset 0 -1px 0 0 rgba(255, 152, 0, 0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ py: 2 }}
          >
            {/* Logo / Brand */}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Typography
                variant="h6"
                component="h1"
                fontWeight={700}
                color="primary"
                sx={{ fontSize: '1.5rem', cursor: 'pointer' }}
              >
                Paimon DEX
              </Typography>
            </Link>

            {/* Navigation Links */}
            <Stack direction="row" spacing={3} alignItems="center">
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    color: 'text.secondary',
                    cursor: 'pointer',
                    transition: 'color 0.3s',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  Swap
                </Typography>
              </Link>

              <Link href="/lock" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    color: 'text.secondary',
                    cursor: 'pointer',
                    transition: 'color 0.3s',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  Lock
                </Typography>
              </Link>

              <Link href="/vote" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    color: 'primary.main', // Active page
                    cursor: 'pointer',
                  }}
                >
                  Vote
                </Typography>
              </Link>

              {/* Connect Wallet Button */}
              <ConnectButton />
            </Stack>
          </Stack>
        </Container>
      </Box>

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
