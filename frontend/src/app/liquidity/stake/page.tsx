'use client';

import { Box, Container, Typography, Stack } from '@mui/material';
import { StakingCard } from '@/components/liquidity/StakingCard';
import { Navigation, LiquidityTabs } from '@/components/layout';

/**
 * Liquidity Staking Page
 * Page for staking LP tokens in liquidity mining gauges
 *
 * Features:
 * - StakingCard component
 * - Navigation with LiquidityTabs
 * - Footer information
 * - OlympusDAO-inspired design
 */
export default function StakePage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top navigation bar */}
      <Navigation activePage="liquidity" />

      {/* Main content area */}
      <Box
        sx={{
          pt: 12, // Account for fixed navbar
          pb: 8,
          px: {
            xs: 2,
            sm: 3,
          },
          minHeight: '100vh',
          background: 'linear-gradient(180deg, rgba(255, 152, 0, 0.02) 0%, rgba(255, 87, 34, 0.01) 100%)',
        }}
      >
        <Container maxWidth="lg">
          {/* Huge whitespace (OlympusDAO style) */}
          <Box sx={{ height: { xs: 40, sm: 60 } }} />

          {/* Liquidity sub-navigation tabs */}
          <LiquidityTabs activeTab="stake" />

          <Stack spacing={6}>
            {/* Page header */}
            <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h1"
              fontWeight={700}
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                background: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1,
              }}
            >
              Liquidity Mining
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem' }}>
              Stake LP tokens • Earn PAIMON Rewards
            </Typography>
          </Box>

          {/* Staking card */}
          <StakingCard />

          {/* Footer information */}
          <Box
            sx={{
              textAlign: 'center',
              p: 4,
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 152, 0, 0.05)',
              border: '1px solid',
              borderColor: 'rgba(255, 152, 0, 0.1)',
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                How Liquidity Mining Works
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
                Stake your LP tokens in liquidity mining gauges to earn PAIMON rewards. The longer you stake, the more
                rewards you accumulate. You can unstake and claim your rewards at any time.
              </Typography>
              <Stack direction="row" spacing={4} justifyContent="center" sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontSize="0.75rem">
                    Step 1
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Select Pool
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontSize="0.75rem">
                    Step 2
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Stake LP Tokens
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontSize="0.75rem">
                    Step 3
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Earn PAIMON
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontSize="0.75rem">
                    Step 4
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Claim Rewards
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
          </Stack>
        </Container>

        {/* Huge whitespace (OlympusDAO style) */}
        <Box sx={{ height: { xs: 40, sm: 60 } }} />
      </Box>
    </Box>
  );
}
