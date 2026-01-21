import { NextResponse } from 'next/server';
import { savePosts, saveReviews } from '@/lib/database';
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

async function handleInit() {
  try {
    // Note: For Supabase, tables should be created via SQL Editor first
    // This endpoint imports existing JSON data into the database

    let postsCount = 0;
    let reelsCount = 0;
    let reviewsCount = 0;

    // Import Instagram posts
    const postsPath = path.join(process.cwd(), 'data', 'instagram-export', 'posts.json');
    if (fs.existsSync(postsPath)) {
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
      postsCount = posts.length;
    }

    // Import Instagram reels
    const reelsPath = path.join(process.cwd(), 'data', 'instagram-export', 'reels.json');
    if (fs.existsSync(reelsPath)) {
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
      reelsCount = reels.length;
    }

    // Import reviews
    const reviewsPath = path.join(process.cwd(), 'data', 'reviews.json');
    if (fs.existsSync(reviewsPath)) {
      const reviewsData = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
      const reviews: Review[] = Array.isArray(reviewsData) ? reviewsData : [];
      if (reviews.length > 0) {
        await saveReviews(reviews);
        reviewsCount = reviews.length;
      }
    }

    return {
      success: true,
      message: 'Data imported successfully',
      imported: {
        posts: postsCount,
        reels: reelsCount,
        reviews: reviewsCount,
        total: postsCount + reelsCount + reviewsCount,
      },
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import data',
    };
  }
}

export async function GET() {
  const result = await handleInit();
  return NextResponse.json(result, {
    status: result.success ? 200 : 500
  });
}

export async function POST() {
  const result = await handleInit();
  return NextResponse.json(result, {
    status: result.success ? 200 : 500
  });
}
