import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { verifyToken, extractTokenFromHeader } from './auth';

const prisma = new PrismaClient();
const router = Router();

// Middleware to verify JWT
export function authMiddleware(req: Request, res: Response, next: any) {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  (req as any).user = payload;
  next();
}

// ============ PRODUCTS ============

// GET /api/products - Get all products with pagination
router.get('/products', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 40;
    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      skip,
      take: limit,
      include: { seller: true, category: true },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.product.count();

    res.json({
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { seller: { include: { profile: true } }, category: true, comments: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ============ PROFILES ============

// GET /api/profile - Get current user's profile
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile - Update user's profile
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { storeName, storeDescription, city, country } = req.body;

    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        storeName,
        storeDescription,
        city,
        country,
      },
      include: { user: true },
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============ WATCHLIST ============

// GET /api/watchlist - Get user's watchlist
router.get('/watchlist', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const watchlist = await prisma.watchlist.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// POST /api/watchlist/:productId - Add to watchlist
router.post('/watchlist/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const productId = req.params.productId;

    const existing = await prisma.watchlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already in watchlist' });
    }

    const watchlistItem = await prisma.watchlist.create({
      data: { userId, productId },
      include: { product: true },
    });

    res.json(watchlistItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// DELETE /api/watchlist/:productId - Remove from watchlist
router.delete('/watchlist/:productId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const productId = req.params.productId;

    await prisma.watchlist.delete({
      where: { userId_productId: { userId, productId } },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

export default router;
