import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: gameId } = req.params;
    const { rating, text } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // Check if review already exists
    const review = await prisma.review.upsert({
      where: {
        gameId_userId: { gameId, userId }
      },
      update: {
        rating: parseInt(rating),
        text: text || ''
      },
      create: {
        gameId,
        userId,
        rating: parseInt(rating),
        text: text || ''
      }
    });

    // Recalculate average rating & counts for the game
    const reviews = await prisma.review.findMany({
      where: { gameId }
    });

    const totalRatings = reviews.length;
    const sumRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = totalRatings > 0 ? sumRatings / totalRatings : 0.0;

    await prisma.game.update({
      where: { id: gameId },
      data: {
        ratingAverage: parseFloat(average.toFixed(1)),
        ratingsCount: totalRatings
      }
    });

    // Award review XP (30 XP for leaving feedback)
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: 30 },
        points: { increment: 5 }
      }
    });

    return res.json({ message: 'Review submitted successfully', review });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: gameId } = req.params;
    const userId = req.user.id;

    const existingLike = await prisma.gameLike.findUnique({
      where: {
        gameId_userId: { gameId, userId }
      }
    });

    if (existingLike) {
      await prisma.gameLike.delete({
        where: {
          gameId_userId: { gameId, userId }
        }
      });

      await prisma.game.update({
        where: { id: gameId },
        data: { likesCount: { decrement: 1 } }
      });

      return res.json({ liked: false, message: 'Like removed' });
    } else {
      await prisma.gameLike.create({
        data: { gameId, userId }
      });

      await prisma.game.update({
        where: { id: gameId },
        data: { likesCount: { increment: 1 } }
      });

      // Award like XP (10 XP)
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: 10 }
        }
      });

      return res.json({ liked: true, message: 'Game liked!' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to toggle like', error: error.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: gameId } = req.params;
    const { text, parentId } = req.body;
    const userId = req.user.id;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const comment = await prisma.comment.create({
      data: {
        gameId,
        userId,
        text,
        parentId: parentId || null
      },
      include: {
        user: {
          select: { username: true, profile: { select: { avatarUrl: true } } }
        }
      }
    });

    return res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { id: gameId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { gameId },
      include: {
        user: {
          select: { username: true, profile: { select: { avatarUrl: true } } }
        },
        replies: {
          include: {
            user: {
              select: { username: true, profile: { select: { avatarUrl: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ comments });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

export const createAchievement = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { gameId, name, description, iconUrl, xpValue } = req.body;

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.developerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const achievement = await prisma.achievement.create({
      data: {
        gameId,
        name,
        description,
        iconUrl: iconUrl || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80',
        xpValue: xpValue ? parseInt(xpValue) : 100
      }
    });

    return res.status(201).json({ message: 'Achievement created successfully', achievement });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create achievement', error: error.message });
  }
};

export const unlockAchievement = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { achievementId } = req.body;
    const userId = req.user.id;

    const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } });
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    const existingUnlock = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId }
      }
    });

    if (existingUnlock) {
      return res.status(400).json({ message: 'Achievement already unlocked' });
    }

    const unlock = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId
      }
    });

    // Reward XP and level up user if they cross thresholds (e.g. 500 XP per level)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const addedXp = achievement.xpValue;
      const totalXp = user.xp + addedXp;
      const newLevel = Math.floor(totalXp / 500) + 1; // 500 XP per level

      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: totalXp,
          level: newLevel,
          points: { increment: 20 }
        }
      });
    }

    return res.status(201).json({ message: 'Achievement unlocked!', unlock });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to unlock achievement', error: error.message });
  }
};

export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const { id: gameId } = req.params;
    const userId = req.user?.id;

    const achievements = await prisma.achievement.findMany({
      where: { gameId },
      orderBy: { xpValue: 'asc' }
    });

    if (userId) {
      const unlocked = await prisma.userAchievement.findMany({
        where: {
          userId,
          achievement: { gameId }
        },
        select: { achievementId: true }
      });
      const unlockedIds = new Set(unlocked.map(u => u.achievementId));
      
      const achievementsWithStatus = achievements.map(ach => ({
        id: ach.id,
        name: ach.name,
        description: ach.description,
        iconUrl: ach.iconUrl,
        xpValue: ach.xpValue,
        unlocked: unlockedIds.has(ach.id)
      }));
      return res.json({ achievements: achievementsWithStatus });
    }

    return res.json({ achievements: achievements.map(ach => ({ ...ach, unlocked: false })) });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch achievements', error: error.message });
  }
};

export const unlockAchievementByName = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: gameId } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Achievement name is required' });
    }

    const achievement = await prisma.achievement.findFirst({
      where: {
        gameId,
        name: { equals: name, mode: 'insensitive' }
      }
    });

    if (!achievement) {
      return res.status(404).json({ message: `Achievement '${name}' not found for this game` });
    }

    const existingUnlock = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId: achievement.id }
      }
    });

    if (existingUnlock) {
      return res.status(200).json({ message: 'Achievement already unlocked', alreadyUnlocked: true });
    }

    const unlock = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    let newLevel = 1;
    let totalXp = 0;
    if (user) {
      totalXp = user.xp + achievement.xpValue;
      newLevel = Math.floor(totalXp / 500) + 1;

      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: totalXp,
          level: newLevel,
          points: { increment: 50 }
        }
      });
    }

    return res.status(201).json({ 
      message: `Achievement unlocked: ${achievement.name}!`, 
      unlock, 
      xpReward: achievement.xpValue,
      newLevel,
      totalXp,
      alreadyUnlocked: false
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to unlock achievement', error: error.message });
  }
};

export const submitScore = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id: gameId } = req.params;
    const { score } = req.body;
    const userId = req.user.id;

    if (score === undefined || isNaN(score)) {
      return res.status(400).json({ message: 'Valid numerical score is required' });
    }

    const parsedScore = parseFloat(score);

    const existing = await prisma.leaderboardScore.findUnique({
      where: {
        gameId_userId: { gameId, userId }
      }
    });

    let savedScore = parsedScore;
    if (existing) {
      if (parsedScore > existing.score) {
        const updated = await prisma.leaderboardScore.update({
          where: { id: existing.id },
          data: { score: parsedScore }
        });
        savedScore = updated.score;
      } else {
        savedScore = existing.score;
      }
    } else {
      await prisma.leaderboardScore.create({
        data: {
          gameId,
          userId,
          score: parsedScore
        }
      });
    }

    if (!existing || parsedScore > existing.score) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const totalXp = user.xp + 20;
        const newLevel = Math.floor(totalXp / 500) + 1;
        await prisma.user.update({
          where: { id: userId },
          data: { xp: totalXp, level: newLevel }
        });
      }
    }

    return res.json({ 
      message: 'Score submitted successfully!', 
      personalBest: savedScore,
      newRecord: !existing || parsedScore > existing.score
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to submit score', error: error.message });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { id: gameId } = req.params;

    const scores = await prisma.leaderboardScore.findMany({
      where: { gameId },
      orderBy: { score: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            username: true,
            level: true,
            profile: {
              select: { avatarUrl: true }
            }
          }
        }
      }
    });

    const formattedScores = scores.map((s, index) => ({
      rank: index + 1,
      username: s.user.username,
      level: s.user.level,
      avatarUrl: s.user.profile?.avatarUrl,
      score: s.score,
      date: s.createdAt
    }));

    return res.json({ leaderboard: formattedScores });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
};
