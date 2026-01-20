#!/usr/bin/env tsx

/**
 * Migration script to import existing JSON data into Vercel Postgres
 *
 * Usage:
 * 1. Set up Vercel Postgres in your project
 * 2. Add POSTGRES_URL to your .env.local
 * 3. Run: npx tsx scripts/migrate-to-postgres.ts
 */

import { initDatabase, savePosts, saveReviews } from '../lib/database';
import fs from 'fs';
import path from 'path';

interface InstagramPost {
  id: string;
  caption?: string;
  timestamp: number | string;
  likes?: number;
  mediaUrl?: string;
}

interface Review {
  restaurant_name: string;
  rating?: number;
  review_text?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
}

async function migrateData() {
  console.log('Starting data migration to Postgres...\n');

  try {
    // Initialize database (create tables if they don't exist)
    console.log('1. Initializing database...');
    await initDatabase();
    console.log('✓ Database initialized\n');

    // Migrate Instagram posts
    const postsPath = path.join(process.cwd(), 'data', 'instagram-export', 'posts.json');
    if (fs.existsSync(postsPath)) {
      console.log('2. Migrating Instagram posts...');
      const postsData = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));

      const posts = postsData.map((post: InstagramPost) => ({
        id: post.id,
        caption: post.caption || '',
        timestamp: new Date(post.timestamp).toISOString(),
        likes: post.likes || 0,
        mediaUrl: post.mediaUrl || null,
        scrapedAt: new Date().toISOString(),
      }));

      await savePosts(posts);
      console.log(`✓ Migrated ${posts.length} posts\n`);
    } else {
      console.log('2. No posts.json found, skipping...\n');
    }

    // Migrate Instagram reels
    const reelsPath = path.join(process.cwd(), 'data', 'instagram-export', 'reels.json');
    if (fs.existsSync(reelsPath)) {
      console.log('3. Migrating Instagram reels...');
      const reelsData = JSON.parse(fs.readFileSync(reelsPath, 'utf-8'));

      const reels = reelsData.map((reel: InstagramPost) => ({
        id: reel.id,
        caption: reel.caption || '',
        timestamp: new Date(reel.timestamp).toISOString(),
        likes: reel.likes || 0,
        mediaUrl: reel.mediaUrl || null,
        scrapedAt: new Date().toISOString(),
      }));

      await savePosts(reels);
      console.log(`✓ Migrated ${reels.length} reels\n`);
    } else {
      console.log('3. No reels.json found, skipping...\n');
    }

    // Migrate reviews
    const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
    if (fs.existsSync(reviewsPath)) {
      console.log('4. Migrating reviews...');
      const reviewsData = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));

      const reviews: Review[] = Array.isArray(reviewsData) ? reviewsData : [];

      if (reviews.length > 0) {
        await saveReviews(reviews);
        console.log(`✓ Migrated ${reviews.length} reviews\n`);
      } else {
        console.log('No reviews to migrate\n');
      }
    } else {
      console.log('4. No reviews.json found, skipping...\n');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();
