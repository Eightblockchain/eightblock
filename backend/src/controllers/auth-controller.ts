import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { signToken } from '@/utils/jwt';

// Wallet-based authentication
export async function walletAuth(req: Request, res: Response) {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    // Find or create user with this wallet address
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { id: true, walletAddress: true, name: true, role: true },
    });

    if (!user) {
      // Create new user with wallet address
      user = await prisma.user.create({
        data: {
          walletAddress,
          name: `User ${walletAddress.substring(0, 8)}...`,
          role: 'WRITER',
        },
        select: { id: true, walletAddress: true, name: true, role: true },
      });
    }

    // Generate JWT token
    const token = signToken({ userId: user.id, role: user.role });

    return res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Wallet auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
