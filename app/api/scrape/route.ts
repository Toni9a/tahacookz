import { NextRequest, NextResponse } from 'next/server';
import { scrapeInstagramPosts } from '@/lib/instagram-scraper';

export async function POST(request: NextRequest) {
  try {
    const { username, maxPosts } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const posts = await scrapeInstagramPosts(username, maxPosts || 50);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape Instagram posts. This might be due to Instagram blocking automated access.' },
      { status: 500 }
    );
  }
}
