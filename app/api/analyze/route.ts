import { NextRequest, NextResponse } from 'next/server';
import {
  parseReview,
  calculateRatingStats,
  calculateRestaurantStats,
  analyzeWordFrequency,
  calculateAdjustedScore,
} from '@/lib/review-parser';
import { InstagramPost } from '@/lib/instagram-scraper';

export async function POST(request: NextRequest) {
  try {
    const { posts }: { posts: InstagramPost[] } = await request.json();

    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json(
        { error: 'Posts array is required' },
        { status: 400 }
      );
    }

    // Parse all reviews
    const reviews = posts
      .map(post => parseReview(post.caption, post.timestamp))
      .filter(review => review !== null);

    if (reviews.length === 0) {
      return NextResponse.json(
        { error: 'No valid reviews found in the posts' },
        { status: 400 }
      );
    }

    // Calculate statistics
    const ratingStats = calculateRatingStats(reviews);
    const restaurantStats = calculateRestaurantStats(reviews);
    const wordFrequency = analyzeWordFrequency(reviews, 2);

    // Add adjusted scores to reviews
    const reviewsWithAdjusted = reviews.map(review => ({
      ...review,
      adjustedScore: calculateAdjustedScore(review.rating, ratingStats),
    }));

    return NextResponse.json({
      reviews: reviewsWithAdjusted,
      stats: {
        ratings: ratingStats,
        restaurants: restaurantStats,
        words: wordFrequency,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze posts' },
      { status: 500 }
    );
  }
}
