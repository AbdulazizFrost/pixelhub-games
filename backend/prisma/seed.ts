import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Categories
  const categoriesData = [
    { name: 'Action', slug: 'action' },
    { name: 'Adventure', slug: 'adventure' },
    { name: 'FPS', slug: 'fps' },
    { name: 'Puzzle', slug: 'puzzle' },
    { name: 'Horror', slug: 'horror' },
    { name: 'Arcade', slug: 'arcade' },
    { name: 'Strategy', slug: 'strategy' },
    { name: 'Simulation', slug: 'simulation' },
    { name: 'RPG', slug: 'rpg' },
    { name: 'Idle / Clicker', slug: 'idle-clicker' },
    { name: 'Casual', slug: 'casual' }
  ];

  console.log('Creating categories...');
  const categories: any = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
  }

  // 2. Create Users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@steam.com' },
    update: {},
    create: {
      email: 'admin@steam.com',
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      level: 15,
      xp: 7500,
      points: 1200,
      profile: {
        create: {
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
          bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
          bio: 'Platform administrator. Respect the rules.'
        }
      }
    }
  });

  const devUser = await prisma.user.upsert({
    where: { email: 'dev@steam.com' },
    update: {},
    create: {
      email: 'dev@steam.com',
      username: 'neon_developer',
      passwordHash,
      role: 'DEVELOPER',
      level: 8,
      xp: 3800,
      points: 450,
      profile: {
        create: {
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=dev',
          bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=80',
          bio: 'Indie WebGL developer. Coding games since 2018.'
        }
      }
    }
  });

  const gamerUser = await prisma.user.upsert({
    where: { email: 'gamer@steam.com' },
    update: {},
    create: {
      email: 'gamer@steam.com',
      username: 'pro_gamer2026',
      passwordHash,
      role: 'USER',
      level: 4,
      xp: 1800,
      points: 210,
      profile: {
        create: {
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=gamer',
          bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
          bio: 'Hardcore browser games enthusiast. Seeking high scores.'
        }
      }
    }
  });

  // 3. Create Games
  console.log('Creating games...');
  
  // Game 1: Neon Runner (Action)
  const game1 = await prisma.game.upsert({
    where: { slug: 'neon-runner' },
    update: {},
    create: {
      title: 'Neon Runner 2026',
      slug: 'neon-runner',
      description: 'Dash through futuristic cyber landscapes in this fast-paced neon infinite runner. Dodge gridwalls, jump across hover-ramps, and collect power-cores to keep your cybernetic battery charged. Featuring stunning high-fidelity WebGL graphics and a dynamic retrowave soundtrack.',
      shortDescription: 'Cyberpunk infinite runner featuring neon graphics and fast-paced gameplay.',
      coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
      categoryId: categories['action'].id,
      tags: ['Cyberpunk', 'WebGL', 'Runner', 'Retrowave', 'Singleplayer'],
      ageRating: '7+',
      version: '1.2.0',
      size: 45.5,
      isFree: true,
      price: 0.0,
      developerId: devUser.id,
      status: 'APPROVED',
      playsCount: 2450,
      likesCount: 142,
      ratingAverage: 4.8,
      ratingsCount: 24,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', type: 'IMAGE' },
          { url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80', type: 'IMAGE' }
        ]
      },
      versions: {
        create: {
          version: '1.2.0',
          buildPath: '/uploads/games/demo/index.html',
          changelog: 'Added new cyber-soundtrack tracks and minor layout bugfixes.'
        }
      },
      achievements: {
        create: [
          { name: 'Grid Walker', description: 'Reach a score of 10,000 meters in a single run.', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80', xpValue: 100 },
          { name: 'Battery Overcharged', description: 'Collect 50 energy cores in one attempt.', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80', xpValue: 150 }
        ]
      }
    }
  });

  // Game 2: Quantum Maze (Puzzle)
  const game2 = await prisma.game.upsert({
    where: { slug: 'quantum-maze' },
    update: {},
    create: {
      title: 'Quantum Maze',
      slug: 'quantum-maze',
      description: 'Manipulate dimensions and shift space to navigate complex architectural labyrinths. Inspired by classic optical illusion puzzles, Quantum Maze tests your visual-spatial intelligence. Solve multi-layered spatial puzzles that redefine directions and gravity.',
      shortDescription: 'A mind-bending puzzle game that plays with dimensions and perspective.',
      coverUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&q=80',
      categoryId: categories['puzzle'].id,
      tags: ['Puzzle', 'WebGL', 'Minimalist', 'Mind-Bending', '3D'],
      ageRating: '3+',
      version: '1.0.1',
      size: 18.2,
      isFree: true,
      price: 0.0,
      developerId: devUser.id,
      status: 'APPROVED',
      playsCount: 1205,
      likesCount: 88,
      ratingAverage: 4.2,
      ratingsCount: 15,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&q=80', type: 'IMAGE' },
          { url: 'https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?w=800&q=80', type: 'IMAGE' }
        ]
      },
      versions: {
        create: {
          version: '1.0.1',
          buildPath: '/uploads/games/demo/index.html',
          changelog: 'Fixed collision gaps in Level 12.'
        }
      },
      achievements: {
        create: [
          { name: 'Flatland Resident', description: 'Complete the tutorial chapters.', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80', xpValue: 50 },
          { name: 'Paradox Resolver', description: 'Solve a puzzle in under 10 shifts.', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80', xpValue: 200 }
        ]
      }
    }
  });

  // Game 3: Shadow Strike (FPS) - Premium
  const game3 = await prisma.game.upsert({
    where: { slug: 'shadow-strike' },
    update: {},
    create: {
      title: 'Shadow Strike: Tactical Combat',
      slug: 'shadow-strike',
      description: 'Experience tactical first-person combat in this high-intensity multiplayer shooting simulator. Designed natively for browser WebGL, Shadow Strike delivers ultra-low latency response, dynamic recoil patterns, CS-like tactical maps, and competitive ranking lists.',
      shortDescription: 'Tactical browser FPS with real-time multiplayer combat simulation.',
      coverUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80',
      categoryId: categories['fps'].id,
      tags: ['Shooter', 'FPS', 'Tactical', 'Multiplayer', 'WebGL'],
      ageRating: '16+',
      version: '0.8.5-beta',
      size: 92.4,
      isFree: false,
      price: 4.99,
      developerId: devUser.id,
      status: 'APPROVED',
      playsCount: 540,
      likesCount: 92,
      ratingAverage: 4.5,
      ratingsCount: 18,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80', type: 'IMAGE' },
          { url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80', type: 'IMAGE' }
        ]
      },
      versions: {
        create: {
          version: '0.8.5-beta',
          buildPath: '/uploads/games/demo/index.html',
          changelog: 'Beta release with 3 competitive arenas.'
        }
      },
      achievements: {
        create: [
          { name: 'First Blood', description: 'Eliminate an opponent in matchmaking.', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80', xpValue: 80 }
        ]
      }
    }
  });

  // 4. Create Reviews
  console.log('Creating mock reviews...');
  await prisma.review.upsert({
    where: {
      gameId_userId: { gameId: game1.id, userId: gamerUser.id }
    },
    update: {},
    create: {
      gameId: game1.id,
      userId: gamerUser.id,
      rating: 5,
      text: 'Absolutely loving the flow state of this game! Controls are incredibly responsive for a WebGL build.'
    }
  });

  await prisma.review.upsert({
    where: {
      gameId_userId: { gameId: game2.id, userId: gamerUser.id }
    },
    update: {},
    create: {
      gameId: game2.id,
      userId: gamerUser.id,
      rating: 4,
      text: 'Good puzzle game, nice illusions, but levels 15 and above are really tricky!'
    }
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
