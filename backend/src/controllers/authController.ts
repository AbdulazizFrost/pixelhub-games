import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-neon-steam-jwt-key-2026';

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, username, password, role } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'All fields (email, username, password) are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role === 'DEVELOPER' || role === 'ADMIN' ? role : 'USER'; // Prevent self-promoting to admin unless explicitly verified (standard user role logic)

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: assignedRole,
        profile: {
          create: {
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
            bio: 'Hi, I am new on the platform!'
          }
        }
      },
      include: {
        profile: true
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        level: user.level,
        xp: user.xp,
        points: user.points,
        profile: user.profile
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        level: user.level,
        xp: user.xp,
        points: user.points,
        profile: user.profile
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        likes: true,
        playHistory: {
          include: {
            game: {
              select: { title: true, slug: true, coverUrl: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        playHistory: {
          take: 5,
          orderBy: { lastPlayedAt: 'desc' },
          include: {
            game: {
              select: { title: true, slug: true, coverUrl: true }
            }
          }
        },
        achievements: {
          include: {
            achievement: {
              include: {
                game: {
                  select: { title: true }
                }
              }
            }
          }
        },
        subscribers: {
          include: {
            user: {
              select: { username: true, id: true, profile: { select: { avatarUrl: true } } }
            }
          }
        },
        subscriptions: {
          include: {
            developer: {
              select: { username: true, id: true, profile: { select: { avatarUrl: true } } }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Omit sensitive data
    const { passwordHash, email, ...safeUserData } = user;

    return res.json({ profile: safeUserData });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { bio, avatarUrl, bannerUrl, favoriteGames } = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        bio,
        avatarUrl,
        bannerUrl,
        favoriteGames
      }
    });

    return res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const toggleSubscribe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { developerId } = req.body;
    const userId = req.user.id;

    if (userId === developerId) {
      return res.status(400).json({ message: 'You cannot subscribe to yourself' });
    }

    const developer = await prisma.user.findUnique({ where: { id: developerId } });
    if (!developer || developer.role !== 'DEVELOPER') {
      return res.status(400).json({ message: 'User is not a registered developer' });
    }

    const existingSub = await prisma.subscription.findUnique({
      where: {
        userId_developerId: { userId, developerId }
      }
    });

    if (existingSub) {
      await prisma.subscription.delete({
        where: {
          userId_developerId: { userId, developerId }
        }
      });
      return res.json({ subscribed: false, message: 'Unsubscribed successfully' });
    } else {
      await prisma.subscription.create({
        data: { userId, developerId }
      });
      return res.json({ subscribed: true, message: 'Subscribed successfully' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
