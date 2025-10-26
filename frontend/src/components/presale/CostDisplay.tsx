'use client';

import { Box, Card, CardContent, Typography, Divider } from '@mui/material';
import { MINT_CONFIG, BOND_PARAMS } from './constants';
import type { CostCalculation } from './types';

interface CostDisplayProps {
  calculation: CostCalculation;
  userBalance?: string;
}

/**
 * Cost Display Component
 * Shows total cost breakdown and user's USDC balance
 */
export function CostDisplay({ calculation, userBalance }: CostDisplayProps) {
  const hasInsufficientBalance = userBalance && parseFloat(userBalance) < calculation.totalCost;

  return (
    <Card
      sx={{
        bgcolor: '#FFF3E0', // Warm cream background
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(255, 140, 0, 0.15)',
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ color: '#D17A00', mb: 2 }}>
          Cost Breakdown
        </Typography>

        {/* Price per NFT */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1" sx={{ color: '#8B4000' }}>
            Price per NFT:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#8B4000' }}>
            {MINT_CONFIG.NFT_PRICE} USDC
          </Typography>
        </Box>

        {/* Quantity */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1" sx={{ color: '#8B4000' }}>
            Quantity:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#8B4000' }}>
            × {calculation.quantity}
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: '#FFB74D' }} />

        {/* Total Cost */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#D17A00' }}>
            Total Cost:
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: hasInsufficientBalance ? '#D32F2F' : '#FF8C00',
            }}
          >
            {calculation.formattedCost} USDC
          </Typography>
        </Box>

        {/* User Balance */}
        {userBalance && (
          <>
            <Divider sx={{ my: 2, borderColor: '#FFB74D' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#A0522D' }}>
                Your USDC Balance:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: hasInsufficientBalance ? '#D32F2F' : '#2E7D32',
                }}
              >
                {parseFloat(userBalance).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                USDC
              </Typography>
            </Box>
          </>
        )}

        {/* Warning if insufficient balance */}
        {hasInsufficientBalance && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 2,
              p: 1,
              bgcolor: '#FFEBEE',
              borderRadius: 1,
              color: '#C62828',
              textAlign: 'center',
            }}
          >
            ⚠️ Insufficient USDC balance
          </Typography>
        )}

        {/* Info about investment */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            textAlign: 'center',
            color: '#A0522D',
          }}
        >
          Each NFT matures in {BOND_PARAMS.MATURITY_DAYS} days with guaranteed yield
        </Typography>
      </CardContent>
    </Card>
  );
}
