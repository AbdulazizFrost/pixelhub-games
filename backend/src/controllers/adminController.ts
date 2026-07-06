import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalDevelopers = await prisma.user.count({ where: { role: 'DEVELOPER' } });
    const totalGames = await prisma.game.count({ where: { status: 'APPROVED' } });
    const pendingGames = await prisma.game.count({ where: { status: 'PENDING' } });

    // Aggregate statistics
    const gamesStats = await prisma.game.aggregate({
      _sum: {
        playsCount: true,
        likesCount: true
      }
    });

    // Simulated revenue stats: free vs paid distributions
    const paidGames = await prisma.game.findMany({
      where: { isFree: false, status: 'APPROVED' },
      select: { price: true, playsCount: true }
    });

    const calculatedRevenue = paidGames.reduce((acc, game) => {
      // Let's assume 5% of play count converted to purchases
      const purchases = Math.floor(game.playsCount * 0.05);
      return acc + (purchases * game.price);
    }, 0);

    return res.json({
      stats: {
        totalUsers,
        totalDevelopers,
        totalGames,
        pendingGames,
        totalPlays: gamesStats._sum.playsCount || 0,
        totalLikes: gamesStats._sum.likesCount || 0,
        estimatedRevenue: parseFloat(calculatedRevenue.toFixed(2))
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

export const getPendingGames = async (req: AuthRequest, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      where: { status: 'PENDING' },
      include: {
        category: true,
        developer: {
          select: { username: true, id: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({ games });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error getting pending games', error: error.message });
  }
};

export const moderateGame = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid moderation status. Must be APPROVED or REJECTED.' });
    }

    const game = await prisma.game.update({
      where: { id },
      data: { status }
    });

    return res.json({ message: `Game review completed. Status set to ${status}`, game });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to moderate game', error: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        level: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ users });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching users list', error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    await prisma.user.delete({
      where: { id }
    });

    return res.json({ message: 'User account and profile deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};
