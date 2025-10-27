'use client';

import { Container, Typography, Box, Stack, Menu, MenuItem } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useState } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CasinoIcon from '@mui/icons-material/Casino';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export type NavPage = 'swap' | 'liquidity' | 'lock' | 'vote' | 'presale';

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
  const [presaleAnchorEl, setPresaleAnchorEl] = useState<null | HTMLElement>(null);
  const presaleMenuOpen = Boolean(presaleAnchorEl);

  const handlePresaleClick = (event: React.MouseEvent<HTMLElement>) => {
    setPresaleAnchorEl(event.currentTarget);
  };

  const handlePresaleClose = () => {
    setPresaleAnchorEl(null);
  };

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

            {/* Presale Dropdown */}
            <Box
              onClick={handlePresaleClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  color: activePage === 'presale' ? 'primary.main' : 'text.secondary',
                  transition: 'color 0.3s',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                Presale
              </Typography>
              <ArrowDropDownIcon
                sx={{
                  color: activePage === 'presale' ? 'primary.main' : 'text.secondary',
                  transition: 'transform 0.3s',
                  transform: presaleMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </Box>

            <Menu
              anchorEl={presaleAnchorEl}
              open={presaleMenuOpen}
              onClose={handlePresaleClose}
              disableScrollLock
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                  mt: 1,
                },
              }}
            >
              <MenuItem
                component={Link}
                href="/presale/mint"
                onClick={handlePresaleClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 152, 0, 0.08)',
                  },
                }}
              >
                <LocalActivityIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  Mint Bond NFT
                </Typography>
              </MenuItem>
              <MenuItem
                component={Link}
                href="/presale/dice"
                onClick={handlePresaleClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 152, 0, 0.08)',
                  },
                }}
              >
                <CasinoIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  Dice Rolling
                </Typography>
              </MenuItem>
              <MenuItem
                component={Link}
                href="/presale/tasks"
                onClick={handlePresaleClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 152, 0, 0.08)',
                  },
                }}
              >
                <EmojiEventsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  Social Tasks
                </Typography>
              </MenuItem>
              <MenuItem
                component={Link}
                href="/presale/leaderboards"
                onClick={handlePresaleClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 152, 0, 0.08)',
                  },
                }}
              >
                <LeaderboardIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  Leaderboards
                </Typography>
              </MenuItem>
              <MenuItem
                component={Link}
                href="/presale/bonds"
                onClick={handlePresaleClose}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 152, 0, 0.08)',
                  },
                }}
              >
                <AccountBalanceWalletIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={600}>
                  Bond Dashboard
                </Typography>
              </MenuItem>
            </Menu>
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
