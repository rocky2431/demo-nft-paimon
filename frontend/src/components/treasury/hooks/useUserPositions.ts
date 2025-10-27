/**
 * useUserPositions Hook
 * Query all user RWA positions from Treasury contract
 */

'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { TREASURY_ADDRESS, TREASURY_ABI } from '@/config/contracts/treasury';
import { RWA_ASSETS } from '../constants';
import { UserPosition } from '@/types/treasury';
import { formatUnits } from 'viem';
import { useRWAPrice } from './useRWAPrice';

export interface PositionWithMetadata extends UserPosition {
  assetSymbol: string;
  assetName: string;
  assetTier: number;
  rwaPrice: number;
  rwaValueUSD: number;
  hydValueUSD: number;
  collateralizationRatio: number;
  healthFactor: number;
  canRedeem: boolean;
  timeUntilRedemption: number; // seconds
}

export function useUserPositions() {
  const { address: userAddress } = useAccount();

  // Query positions for all RWA assets
  const positionQueries = RWA_ASSETS.map((asset) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: positionData, isLoading, refetch } = useReadContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'getUserPosition',
      args: userAddress ? [userAddress, asset.address as `0x${string}`] : undefined,
      query: {
        enabled: !!userAddress,
      },
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: canRedeemData } = useReadContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'canRedeem',
      args: userAddress ? [userAddress, asset.address as `0x${string}`] : undefined,
      query: {
        enabled: !!userAddress,
      },
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { price: rwaPrice } = useRWAPrice(asset.address);

    return {
      asset,
      positionData,
      canRedeemData,
      rwaPrice,
      isLoading,
      refetch,
    };
  });

  // Query redemption cooldown constant
  const { data: redemptionCooldownData } = useReadContract({
    address: TREASURY_ADDRESS,
    abi: TREASURY_ABI,
    functionName: 'REDEMPTION_COOLDOWN',
  });

  const redemptionCooldown = redemptionCooldownData ? Number(redemptionCooldownData) : 7 * 24 * 60 * 60; // Default 7 days

  // Transform data into enriched positions
  const positions: PositionWithMetadata[] = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);

    return positionQueries
      .filter((query) => {
        // Filter out empty positions
        if (!query.positionData) return false;
        const [, rwaAmount] = query.positionData;
        return rwaAmount > 0n;
      })
      .map((query) => {
        const { asset, positionData, canRedeemData, rwaPrice } = query;
        const [rwaAsset, rwaAmount, hydMinted, depositTime] = positionData!;

        // Calculate USD values
        const rwaAmountFloat = parseFloat(formatUnits(rwaAmount, 18));
        const hydMintedFloat = parseFloat(formatUnits(hydMinted, 18));
        const rwaValueUSD = rwaAmountFloat * rwaPrice;
        const hydValueUSD = hydMintedFloat; // HYD is 1:1 with USD

        // Calculate collateralization ratio (collateral / debt * 100%)
        const collateralizationRatio = hydValueUSD > 0 ? (rwaValueUSD / hydValueUSD) * 100 : 999;

        // Calculate health factor (same as collateralization ratio for now)
        // In production, this would consider liquidation thresholds
        const healthFactor = collateralizationRatio;

        // Calculate time until redemption
        const depositTimeNum = Number(depositTime);
        const timeUntilRedemption = Math.max(0, depositTimeNum + redemptionCooldown - now);

        return {
          rwaAsset,
          rwaAmount,
          hydMinted,
          depositTime,
          assetSymbol: asset.symbol,
          assetName: asset.name,
          assetTier: asset.tier,
          rwaPrice,
          rwaValueUSD,
          hydValueUSD,
          collateralizationRatio,
          healthFactor,
          canRedeem: canRedeemData === true,
          timeUntilRedemption,
        };
      });
  }, [positionQueries, redemptionCooldown]);

  // Aggregate loading state
  const isLoading = positionQueries.some((query) => query.isLoading);

  // Refetch all positions
  const refetchAll = () => {
    positionQueries.forEach((query) => query.refetch());
  };

  // Calculate aggregate stats
  const totalCollateralUSD = positions.reduce((sum, pos) => sum + pos.rwaValueUSD, 0);
  const totalDebtUSD = positions.reduce((sum, pos) => sum + pos.hydValueUSD, 0);
  const overallHealthFactor = totalDebtUSD > 0 ? (totalCollateralUSD / totalDebtUSD) * 100 : 999;

  return {
    positions,
    isLoading,
    refetchAll,
    totalCollateralUSD,
    totalDebtUSD,
    overallHealthFactor,
  };
}
