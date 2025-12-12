import type { Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { signToken } from '@/utils/jwt';
import { generateNonce, verifyAndConsumeNonce } from '@/utils/nonce';
import { CSRF_COOKIE_NAME, csrfCookieOptions, generateCsrfToken } from '@/utils/csrf';
import { verifyCardanoSignature, verifyPublicKeyMatchesAddress } from '@/utils/signature';

// Step 1: Request a nonce for wallet authentication
export async function requestNonce(req: Request, res: Response) {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  // Validate wallet address format (Cardano addresses start with addr1)
  if (!walletAddress.startsWith('addr1')) {
    return res.status(400).json({ error: 'Invalid Cardano wallet address format' });
  }

  try {
    const nonce = await generateNonce(walletAddress);

    // Return just the nonce - wallet will sign it directly
    return res.json({
      nonce,
      message: `Authenticate with Eight Block\nNonce: ${nonce}`, // Human readable message
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    return res.status(500).json({ error: 'Failed to generate authentication challenge' });
  }
}

// Step 2: Verify signature and authenticate
export async function walletAuth(req: Request, res: Response) {
  const { walletAddress, nonce, signature, key } = req.body;

  if (!walletAddress || !nonce || !signature || !key) {
    return res.status(400).json({
      error: 'Wallet address, nonce, signature, and key are required',
    });
  }

  // Validate wallet address format
  if (!walletAddress.startsWith('addr1')) {
    return res.status(400).json({ error: 'Invalid Cardano wallet address format' });
  }

  try {
    // Verify the nonce is valid and not expired
    const isNonceValid = await verifyAndConsumeNonce(walletAddress, nonce);
    if (!isNonceValid) {
      return res.status(401).json({
        error: 'Authentication failed',
      });
    }

    // Verify the signature (validates cryptographic proof of wallet ownership)
    const signatureResult = await verifyCardanoSignature(walletAddress, nonce, signature, key);
    if (!signatureResult.valid) {
      return res.status(401).json({
        error: 'Authentication failed',
      });
    }

    // Verify public key actually belongs to the claimed wallet address
    // This extracts and compares payment key hashes, working with any address type
    const publicKeyMatches = await verifyPublicKeyMatchesAddress(
      signatureResult.publicKey,
      walletAddress
    );

    if (!publicKeyMatches) {
      console.warn('[Security] Public key does not match claimed wallet address');
      return res.status(401).json({
        error: 'Authentication failed',
      });
    }

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

    // Generate JWT token with enhanced security
    const token = signToken({
      userId: user.id,
      role: user.role,
      walletAddress: user.walletAddress,
    });

    // Set token in httpOnly cookie (XSS protection)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Rotate CSRF token so the client has a fresh value for future mutations
    res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), csrfCookieOptions);

    return res.json({
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
