/**
 * Treasury Positions Page
 * Position monitoring dashboard with health factor tracking and auto-refresh
 */

'use client';

import { Container, Typography, Box } from '@mui/material';
import { Navigation } from '@/components/layout/Navigation';
import { PositionList } from '@/components/treasury/PositionList';
import { TREASURY_THEME, TREASURY_CARD_STYLES } from '@/components/treasury/constants';

export default function TreasuryPositionsPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top navigation bar */}
      <Navigation activePage="treasury" />

      {/* Main content area */}
      <Container
        maxWidth="xl"
        sx={{
          pt: 12, // Account for fixed navbar
          pb: 8,
          px: {
            xs: 2,
            sm: 3,
          },
          minHeight: '100vh',
        }}
      >
        {/* Header section */}
        <Box
          sx={{
            mb: 6,
            textAlign: 'center',
            pt: { xs: 4, sm: 6 },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: TREASURY_THEME.PRIMARY,
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            }}
          >
            Position Monitoring
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 700,
              mx: 'auto',
              fontSize: { xs: '1rem', sm: '1.125rem' },
            }}
          >
            Monitor your RWA collateral positions and health factors
          </Typography>
        </Box>

        {/* Position list */}
        <PositionList />

        {/* Info section */}
        <Box
          sx={{
            ...TREASURY_CARD_STYLES.info,
            mt: 6,
            p: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: TREASURY_THEME.PRIMARY,
              mb: 2,
            }}
          >
            Understanding Health Factor
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Healthy (Green, &gt;150%):</strong> Your position is safe with plenty of buffer
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Warning (Yellow, 115-150%):</strong> Consider adding collateral to improve safety
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>At Risk (Red, &lt;115%):</strong> Position may be liquidated. Add collateral immediately
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: TREASURY_THEME.ACCENT,
                mb: 1,
              }}
            >
              Position Actions:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                <strong>Redeem Collateral:</strong> Withdraw your RWA assets after 7-day cooldown period
              </Typography>
              <Typography component="li" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                <strong>Add Collateral:</strong> Deposit more RWA to improve your health factor
              </Typography>
              <Typography component="li" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                <strong>Auto-Refresh:</strong> Positions automatically update every 60 seconds
              </Typography>
              <Typography component="li" variant="caption" color="text.secondary">
                <strong>Export CSV:</strong> Download your position history for record keeping
              </Typography>
            </Box>
          </Box>
        </Box>

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
          RWA Treasury • BSC Network • Real-time Monitoring
        </Typography>
      </Container>
    </Box>
  );
}
