'use client';

import { Box, Container, Typography, Stack, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { RemoveLiquidityCard } from '@/components/liquidity/RemoveLiquidityCard';
import { ANIMATION_CONFIG } from '@/components/liquidity/constants';

/**
 * Remove Liquidity Page
 * OlympusDAO-inspired liquidity removal interface
 *
 * Features:
 * - Navigation back to liquidity hub
 * - RemoveLiquidityCard integration
 * - Responsive layout
 * - Orange gradient accents
 */
export default function RemoveLiquidityPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        pt: 12,
        pb: 8,
      }}
    >
      <Container maxWidth="lg">
        {/* Navigation */}
        <Box sx={{ mb: 6 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/liquidity')}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: `all ${ANIMATION_CONFIG.DURATION_NORMAL}`,

              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'rgba(255, 152, 0, 0.05)',
              },
            }}
          >
            Back to Liquidity
          </Button>
        </Box>

        {/* Page header */}
        <Stack spacing={1} sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight={700}
            sx={{
              background: 'linear-gradient(90deg, #FF9800 0%, #F57C00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Remove Liquidity
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
            Redeem your LP tokens and withdraw underlying assets
          </Typography>
        </Stack>

        {/* Main content */}
        <Box sx={{ mb: 8 }}>
          <RemoveLiquidityCard />
        </Box>

        {/* Footer text */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            fontSize: '0.75rem',
          }}
        >
          Remove Liquidity • Redeem Underlying Tokens
        </Typography>
      </Container>
    </Box>
  );
}
