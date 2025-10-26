'use client';

import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress, Link as MuiLink } from '@mui/material';
import { Casino, CheckCircle } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import { DiceAnimation } from './DiceAnimation';
import { RollCooldownTimer } from './RollCooldownTimer';
import { useRollDice } from './hooks/useRollDice';

type DiceType = 'NORMAL' | 'GOLD' | 'DIAMOND';

/**
 * DiceRoller Component
 * Main dice rolling interface with cooldown timer and result animation
 */
export function DiceRoller() {
  const { tokenId, diceData, rollResult, canRoll, rollDice, isRolling, isSuccess, error, txHash } = useRollDice();

  const [showConfetti, setShowConfetti] = useState(false);
  const [demoRolling, setDemoRolling] = useState(false);
  const [demoResult, setDemoResult] = useState<number | undefined>(undefined);
  const { width, height } = useWindowSize();

  // Map contract dice type (0,1,2) to component type
  const getDiceType = (): DiceType => {
    if (!diceData) return 'NORMAL';
    return ['NORMAL', 'GOLD', 'DIAMOND'][diceData.diceType] as DiceType;
  };

  const diceType = getDiceType();

  // Show confetti for high rolls
  useEffect(() => {
    const result = rollResult?.result || demoResult;
    if (result) {
      const isHighRoll =
        (diceType === 'DIAMOND' && result > 15) ||
        (diceType === 'GOLD' && result > 10) ||
        (diceType === 'NORMAL' && result === 6);

      if (isHighRoll) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [rollResult, demoResult, diceType]);

  // Demo roll handler (for users without NFT)
  const handleDemoRoll = () => {
    setDemoRolling(true);
    setDemoResult(undefined);

    // Simulate 1.5s roll animation
    setTimeout(() => {
      const randomResult = Math.floor(Math.random() * 12) + 1; // 1-12 for GOLD dice
      setDemoResult(randomResult);
      setDemoRolling(false);
    }, 1500);
  };

  // Get BSCScan link
  const getBscScanLink = (hash: string) => {
    const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? '' : 'testnet.';
    return `https://${network}bscscan.com/tx/${hash}`;
  };

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
      {/* Confetti Effect */}
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      {/* Header */}
      <Typography variant="h3" fontWeight="bold" textAlign="center" sx={{ mb: 4, color: '#FF8C00' }}>
        <Casino sx={{ fontSize: '48px', mr: 2, verticalAlign: 'middle' }} />
        Weekly Dice Roll
      </Typography>

      {/* No NFT Warning */}
      {!tokenId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Demo Mode: You can see the dice animation! Mint Bond NFTs to actually roll and earn rewards.
        </Alert>
      )}

      {/* Always show dice (demo mode) */}
      <>
        {/* Dice Animation */}
        <Card sx={{ mt: 3, mb: 3, boxShadow: 3 }}>
          <CardContent>
            <DiceAnimation
              type={tokenId ? diceType : 'GOLD'}
              result={rollResult?.result || demoResult}
              isRolling={isRolling || demoRolling}
            />
          </CardContent>
        </Card>

        {/* Cooldown Timer */}
        {tokenId && diceData && diceData.lastRollTimestamp > 0 && (
          <RollCooldownTimer lastRollTimestamp={diceData.lastRollTimestamp} />
        )}

        {/* Roll Button */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            disabled={tokenId ? (!canRoll || isRolling) : demoRolling}
            onClick={!tokenId ? handleDemoRoll : rollDice}
            startIcon={(isRolling || demoRolling) ? <CircularProgress size={20} color="inherit" /> : <Casino />}
            sx={{
              px: 6,
              py: 2,
              fontSize: '18px',
              fontWeight: 'bold',
              background: (tokenId && !canRoll) ? '#ccc' : 'linear-gradient(90deg, #FF8C00 0%, #FF6347 100%)',
              '&:hover': {
                background: (tokenId && !canRoll) ? '#ccc' : 'linear-gradient(90deg, #FF6347 0%, #FF4500 100%)',
              },
            }}
          >
            {!tokenId
              ? (demoRolling ? 'Rolling Demo...' : 'Try Demo Roll')
              : (isRolling ? 'Rolling...' : canRoll ? 'Roll Dice' : 'Cooldown Active')}
          </Button>
        </Box>

          {/* Result Display */}
          {(rollResult || demoResult) && (
            <Card sx={{ mt: 3, background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE8CC 100%)', boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CheckCircle color="success" sx={{ fontSize: '32px' }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
                    {demoResult ? 'Demo Result' : 'Roll Result'}
                  </Typography>
                </Box>

                <Typography variant="h2" fontWeight="bold" color="primary" textAlign="center" sx={{ my: 3 }}>
                  {rollResult?.result || demoResult}
                </Typography>

                {demoResult && demoResult > 10 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    🎉 Great demo roll! You got {demoResult}/12 on Gold dice!
                  </Alert>
                )}

                {rollResult?.result && rollResult.result > 15 && diceType === 'DIAMOND' && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    🎉 Amazing roll! You got {rollResult.result}/20 on Diamond dice!
                  </Alert>
                )}

                {rollResult?.remintAmount && (
                  <Typography variant="body1" textAlign="center" color="text.secondary">
                    Remint Earned: {rollResult.remintAmount.toString()} USDC
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <MuiLink href={getBscScanLink(txHash)} target="_blank" rel="noopener" underline="hover">
                View on BSCScan: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </MuiLink>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error.message || 'An error occurred while rolling the dice.'}
            </Alert>
          )}

          {/* Dice Stats */}
          {diceData && (
            <Card sx={{ mt: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Your Dice Stats
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Rolls This Week
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {diceData.rollsThisWeek}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Highest Roll
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {diceData.highestDiceRoll}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Remint Earned
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {diceData.totalRemintEarned.toString()} USDC
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Token ID
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      #{tokenId}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
