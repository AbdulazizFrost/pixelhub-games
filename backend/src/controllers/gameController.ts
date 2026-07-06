import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { validateAndExtractZip } from '../utils/security';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

export const createGame = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { title, description, shortDescription, categoryId, tags, ageRating, isFree, price, version } = req.body;

    if (!title || !description || !shortDescription || !categoryId) {
      return res.status(400).json({ message: 'Missing required string fields' });
    }

    // Check files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || !files['cover'] || !files['zipFile']) {
      return res.status(400).json({ message: 'Cover image and game ZIP build are required files' });
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existingGame = await prisma.game.findUnique({ where: { slug } });
    if (existingGame) {
      return res.status(400).json({ message: 'A game with a similar title already exists' });
    }

    // Process files paths
    // In Express, multer saves files. We serve them relative to the upload folder
    const coverUrl = `/uploads/covers/${files['cover'][0].filename}`;
    const bannerUrl = files['banner']
      ? `/uploads/banners/${files['banner'][0].filename}`
      : coverUrl;

    const screenshots: string[] = [];
    if (files['screenshots']) {
      files['screenshots'].forEach((file) => {
        screenshots.push(`/uploads/screenshots/${file.filename}`);
      });
    }

    // Extract & Validate ZIP safely
    const zipPath = files['zipFile'][0].path;
    const extractDest = path.join(UPLOAD_DIR, 'games', 'extracted', slug);

    const validation = validateAndExtractZip(zipPath, extractDest);
    
    // Clean up temporary uploaded zip file immediately
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    if (!validation.isValid) {
      if (fs.existsSync(extractDest)) {
        fs.rmSync(extractDest, { recursive: true, force: true });
      }
      return res.status(400).json({ message: 'Ошибка безопасности или структуры архива', error: validation.error });
    }

    const sizeInMB = validation.uncompressedSizeMB || 0.0;

    // Verify index.html exists recursively
    const findIndexHtml = (dir: string): string | null => {
      const filesList = fs.readdirSync(dir);
      if (filesList.includes('index.html')) return '';
      for (const item of filesList) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          const subPath = findIndexHtml(fullPath);
          if (subPath !== null) return path.join(item, subPath).replace(/\\/g, '/');
        }
      }
      return null;
    };

    const relativeIndexFolder = findIndexHtml(extractDest);
    if (relativeIndexFolder === null) {
      fs.rmSync(extractDest, { recursive: true, force: true });
      return res.status(400).json({ message: 'Invalid game build: index.html not found inside the ZIP structure.' });
    }

    // Build Entry path for browser iframe access
    // Path will be e.g.: /uploads/games/extracted/{slug}/{relativeIndexFolder}/index.html
    const buildPath = `/uploads/games/extracted/${slug}/${relativeIndexFolder ? relativeIndexFolder + '/' : ''}index.html`;

    const parsedTags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags || [];

    let parsedAchievements = [];
    try {
      if (req.body.achievements) {
        parsedAchievements = typeof req.body.achievements === 'string' 
          ? JSON.parse(req.body.achievements) 
          : req.body.achievements;
      }
    } catch (e) {
      console.error("Failed to parse achievements:", e);
    }

    // Create DB entry
    const game = await prisma.game.create({
      data: {
        title,
        slug,
        description,
        shortDescription,
        coverUrl,
        bannerUrl,
        categoryId,
        tags: parsedTags,
        ageRating: ageRating || '3+',
        version: version || '1.0.0',
        size: parseFloat(sizeInMB.toFixed(2)),
        isFree: isFree === 'true' || isFree === true,
        price: price ? parseFloat(price) : 0.0,
        developerId: req.user.id,
        status: 'PENDING', // Submissions go to admin queue first
        achievements: {
          create: parsedAchievements.map((ach: any) => ({
            name: ach.name,
            description: ach.description,
            xpValue: ach.xpValue ? parseInt(ach.xpValue) : 50,
            iconUrl: ach.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80'
          }))
        },
        media: {
          create: screenshots.map((url) => ({
            url,
            type: 'IMAGE'
          }))
        },
        versions: {
          create: {
            version: version || '1.0.0',
            buildPath,
            changelog: 'Initial Release'
          }
        }
      }
    });

    // Award XP to Developer for publishing a game!
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        xp: { increment: 150 },
        points: { increment: 50 }
      }
    });

    return res.status(201).json({ message: 'Game uploaded and sent for admin review!', game });
  } catch (error: any) {
    console.error('Create game error:', error);
    return res.status(500).json({ message: 'Failed to create game', error: error.message });
  }
};

export const getGames = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, tag, isFree, sort, developerId, status } = req.query;

    const whereClause: any = {};

    // By default, common visitors only see APPROVED games
    if (status) {
      // Admins or developers checking their own games can request status
      whereClause.status = status as any;
    } else {
      whereClause.status = 'APPROVED';
    }

    if (developerId) {
      whereClause.developerId = developerId as string;
    }

    if (category) {
      whereClause.category = { slug: category as string };
    }

    if (tag) {
      whereClause.tags = { has: tag as string };
    }

    if (isFree !== undefined) {
      whereClause.isFree = isFree === 'true';
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } },
        { shortDescription: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    let orderBy: any = { createdAt: 'desc' }; // default sort: new
    if (sort === 'popular') {
      orderBy = { playsCount: 'desc' };
    } else if (sort === 'likes') {
      orderBy = { likesCount: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { ratingAverage: 'desc' };
    } else if (sort === 'alphabetical') {
      orderBy = { title: 'asc' };
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      include: {
        category: true,
        developer: {
          select: { username: true, id: true, profile: { select: { avatarUrl: true } } }
        }
      },
      orderBy
    });

    return res.json({ games });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching games', error: error.message });
  }
};

export const getGameBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const game = await prisma.game.findUnique({
      where: { slug },
      include: {
        category: true,
        media: true,
        developer: {
          select: { username: true, id: true, profile: { select: { avatarUrl: true, bio: true } } }
        },
        versions: { orderBy: { createdAt: 'desc' } },
        achievements: true,
        reviews: {
          include: {
            user: {
              select: { username: true, profile: { select: { avatarUrl: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    return res.json({ game });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching game details', error: error.message });
  }
};

export const updateGame = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, description, shortDescription, categoryId, tags, ageRating, isFree, price } = req.body;

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.developerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const updateData: any = {
      title,
      description,
      shortDescription,
      categoryId,
      ageRating,
      isFree: isFree === 'true' || isFree === true,
      price: price ? parseFloat(price) : 0.0
    };

    if (tags) {
      updateData.tags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags;
    }

    if (files) {
      if (files['cover']) {
        updateData.coverUrl = `/uploads/covers/${files['cover'][0].filename}`;
      }
      if (files['banner']) {
        updateData.bannerUrl = `/uploads/banners/${files['banner'][0].filename}`;
      }
    }

    const updatedGame = await prisma.game.update({
      where: { id },
      data: updateData
    });

    return res.json({ message: 'Game updated successfully', game: updatedGame });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update game', error: error.message });
  }
};

export const uploadNewVersion = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { version, changelog } = req.body;

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.developerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || !files['zipFile']) {
      return res.status(400).json({ message: 'New game ZIP build file is required' });
    }

    // Extract & Validate ZIP safely
    const zipPath = files['zipFile'][0].path;
    const slug = game.slug;
    const extractDest = path.join(UPLOAD_DIR, 'games', 'extracted', slug);

    const validation = validateAndExtractZip(zipPath, extractDest);
    
    // Clean up temporary uploaded zip file immediately
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    if (!validation.isValid) {
      if (fs.existsSync(extractDest)) {
        fs.rmSync(extractDest, { recursive: true, force: true });
      }
      return res.status(400).json({ message: 'Ошибка безопасности или структуры архива', error: validation.error });
    }

    const sizeInMB = validation.uncompressedSizeMB || 0.0;

    const findIndexHtml = (dir: string): string | null => {
      const filesList = fs.readdirSync(dir);
      if (filesList.includes('index.html')) return '';
      for (const item of filesList) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          const subPath = findIndexHtml(fullPath);
          if (subPath !== null) return path.join(item, subPath).replace(/\\/g, '/');
        }
      }
      return null;
    };

    const relativeIndexFolder = findIndexHtml(extractDest);
    if (relativeIndexFolder === null) {
      fs.rmSync(extractDest, { recursive: true, force: true });
      return res.status(400).json({ message: 'Invalid game build: index.html not found inside the ZIP structure.' });
    }

    const buildPath = `/uploads/games/extracted/${slug}/${relativeIndexFolder ? relativeIndexFolder + '/' : ''}index.html`;

    await prisma.gameVersion.create({
      data: {
        gameId: id,
        version,
        buildPath,
        changelog: changelog || 'Version update'
      }
    });

    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        version,
        size: parseFloat(sizeInMB.toFixed(2))
      }
    });

    return res.json({ message: 'New version published successfully!', game: updatedGame });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to upload new version', error: error.message });
  }
};

export const incrementPlays = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const game = await prisma.game.update({
      where: { id },
      data: { playsCount: { increment: 1 } }
    });

    // If user is authenticated, track their play history and award initial interaction XP
    if (req.user) {
      const userId = req.user.id;

      const existingHistory = await prisma.playHistory.findUnique({
        where: { userId_gameId: { userId, gameId: id } }
      });

      if (existingHistory) {
        await prisma.playHistory.update({
          where: { userId_gameId: { userId, gameId: id } },
          data: { lastPlayedAt: new Date() }
        });
      } else {
        await prisma.playHistory.create({
          data: { userId, gameId: id }
        });

        // Award play XP (50 XP for trying a new game)
        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: 50 },
            points: { increment: 10 }
          }
        });
      }
    }

    return res.json({ playsCount: game.playsCount });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error tracking play', error: error.message });
  }
};

export const deleteGame = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.developerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete static files directory for extracted builds
    const folderPath = path.join(UPLOAD_DIR, 'games', 'extracted', game.slug);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    await prisma.game.delete({ where: { id } });

    return res.json({ message: 'Game deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete game', error: error.message });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({ categories });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};
