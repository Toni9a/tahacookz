import { NextResponse } from 'next/server';
import { savePosts, saveReviews } from '@/lib/database';
import fs from 'fs';
import path from 'path';

interface InstagramPost {
  id?: string;
  caption?: string;
  title?: string;
  timestamp?: number | string;
  creation_timestamp?: number;
  likes?: number;
  mediaUrl?: string;
  media?: Array<{
    uri: string;
    creation_timestamp: number;
  }>;
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
      const posts = postsData.map((post: InstagramPost) => {
        // Handle Instagram export format
        const timestamp = post.creation_timestamp || post.timestamp;
        const timestampMs = typeof timestamp === 'number'
          ? timestamp * 1000 // Convert Unix timestamp (seconds) to milliseconds
          : timestamp || Date.now();

        // Generate ID from first media URI or use existing ID
        const id = post.id || (post.media && post.media[0]?.uri.split('/').pop()?.split('.')[0]) || `post_${Date.now()}`;
        const mediaUrl = post.mediaUrl || (post.media && post.media[0]?.uri) || null;

        return {
          id,
          caption: post.title || post.caption || '',
          timestamp: new Date(timestampMs).toISOString(),
          likes: post.likes || 0,
          mediaUrl,
          scrapedAt: new Date().toISOString(),
        };
      });
      await savePosts(posts);
      postsCount = posts.length;
    }

    // Import Instagram reels
    const reelsPath = path.join(process.cwd(), 'data', 'instagram-export', 'reels.json');
    if (fs.existsSync(reelsPath)) {
      const reelsFile = JSON.parse(fs.readFileSync(reelsPath, 'utf-8'));
      // Handle Instagram export format - reels are nested under ig_reels_media
      const reelsData = Array.isArray(reelsFile) ? reelsFile : (reelsFile.ig_reels_media || []);
      const reels = reelsData.map((reel: InstagramPost) => {
        // Handle Instagram export format
        const timestamp = reel.creation_timestamp || reel.timestamp;
        const timestampMs = typeof timestamp === 'number'
          ? timestamp * 1000 // Convert Unix timestamp (seconds) to milliseconds
          : timestamp || Date.now();

        // Generate ID from first media URI or use existing ID
        const id = reel.id || (reel.media && reel.media[0]?.uri.split('/').pop()?.split('.')[0]) || `reel_${Date.now()}`;
        const mediaUrl = reel.mediaUrl || (reel.media && reel.media[0]?.uri) || null;

        return {
          id,
          caption: reel.title || reel.caption || '',
          timestamp: new Date(timestampMs).toISOString(),
          likes: reel.likes || 0,
          mediaUrl,
          scrapedAt: new Date().toISOString(),
        };
      });
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
