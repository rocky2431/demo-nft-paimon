'use client';

import { Container, Typography, Box, Stack } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export type NavPage = 'swap' | 'liquidity' | 'lock' | 'vote';

interface NavigationProps {
  /**
   * The currently active page
   */
  activePage: NavPage;
}

/**
 * Navigation Component
 * Top navigation bar with logo, nav links, and wallet connect
 *
 * Features:
 * - Fixed position header
 * - Responsive layout (xl container)
 * - Active page highlighting
 * - Proper flex spacing (no overlap)
 * - OlympusDAO-inspired design
 */
export function Navigation({ activePage }: NavigationProps) {
  return (
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
      <Container maxWidth="xl">
        <Stack
          direction="row"
          alignItems="center"
          sx={{ py: 2, gap: 4 }}
        >
          {/* Logo / Brand */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography
              variant="h6"
              component="h1"
              fontWeight={700}
              color="primary"
              sx={{ fontSize: '1.5rem', cursor: 'pointer', flexShrink: 0 }}
            >
              Paimon DEX
            </Typography>
          </Link>

          {/* Navigation Links */}
          <Stack direction="row" spacing={3} alignItems="center" sx={{ flexGrow: 0 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  color: activePage === 'swap' ? 'primary.main' : 'text.secondary',
                  cursor: 'pointer',
                  transition: 'color 0.3s',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                Swap
              </Typography>
            </Link>

            <Link href="/liquidity/add" style={{ textDecoration: 'none' }}>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  color: activePage === 'liquidity' ? 'primary.main' : 'text.secondary',
                  cursor: 'pointer',
                  transition: 'color 0.3s',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                Liquidity
              </Typography>
            </Link>

            <Link href="/lock" style={{ textDecoration: 'none' }}>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  color: activePage === 'lock' ? 'primary.main' : 'text.secondary',
                  cursor: 'pointer',
                  transition: 'color 0.3s',
                  whiteSpace: 'nowrap',
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
                  color: activePage === 'vote' ? 'primary.main' : 'text.secondary',
                  cursor: 'pointer',
                  transition: 'color 0.3s',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                Vote
              </Typography>
            </Link>
          </Stack>

          {/* Spacer - pushes wallet button to far right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Connect Wallet Button */}
          <Box sx={{ flexShrink: 0 }}>
            <ConnectButton />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
