import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { logger } from '../utils/logger.js';

export interface SupportWalletInput {
  id?: string;
  network: string;
  currency: string;
  address: string;
  label: string | null;
  note: string | null;
  enabled: boolean;
}

const publicFields = {
  id: true,
  network: true,
  currency: true,
  address: true,
  label: true,
  note: true,
} as const;

const order = [{ position: 'asc' as const }, { createdAt: 'asc' as const }];

/** Enabled wallets, in display order, for the blog. */
export async function listSupportWallets(_req: Request, res: Response) {
  try {
    const wallets = await prisma.supportWallet.findMany({
      where: { enabled: true },
      orderBy: order,
      select: publicFields,
    });
    return res.json(wallets);
  } catch (error) {
    logger.error(`listSupportWallets: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to load support wallets' });
  }
}

/** Every wallet, including disabled ones, for the admin editor. */
export async function listAllSupportWallets(_req: Request, res: Response) {
  try {
    return res.json(await prisma.supportWallet.findMany({ orderBy: order }));
  } catch (error) {
    logger.error(`listAllSupportWallets: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to load support wallets' });
  }
}

/**
 * Saves the whole list at once: rows missing from the payload are deleted, and the payload order
 * becomes the display order.
 */
export async function replaceSupportWallets(req: Request, res: Response) {
  const { wallets } = req.body as { wallets: SupportWalletInput[] };

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const keep = wallets.flatMap((wallet) => (wallet.id ? [wallet.id] : []));
      await tx.supportWallet.deleteMany({ where: { id: { notIn: keep } } });

      for (const [position, { id, ...fields }] of wallets.entries()) {
        const data = { ...fields, position };
        if (id) {
          await tx.supportWallet.upsert({ where: { id }, create: { id, ...data }, update: data });
        } else {
          await tx.supportWallet.create({ data });
        }
      }
      return tx.supportWallet.findMany({ orderBy: order });
    });
    return res.json(saved);
  } catch (error) {
    logger.error(`replaceSupportWallets: ${(error as Error).message}`);
    return res.status(500).json({ error: 'Failed to save support wallets' });
  }
}
