'use client';

import { Container, Typography, Box } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h1" component="h1" color="primary">
          Paimon DEX
        </Typography>
        <Typography variant="h3" component="h2" color="text.secondary">
          ve33 Decentralized Exchange
        </Typography>
        <ConnectButton />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 4 }}>
          Next.js 14 + wagmi v2 + Material-UI v5 + BSC
        </Typography>
      </Box>
    </Container>
  );
}
